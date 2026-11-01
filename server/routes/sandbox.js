/**
 * Cortex Hub - Live sandbox (SRS SBX-02..05)
 * Answers a question about a sample or uploaded document with Claude, streaming the
 * answer over Server-Sent Events and returning citations into the document.
 * Uploaded documents are held in memory for the request only and never stored.
 */

import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { prisma, validate } from "../lib/common.js";
import { findMembership, sha256 } from "../auth.js";
import { SAMPLE_DOCUMENTS } from "../sandbox/samples.js";

const MODEL = process.env.SANDBOX_MODEL || "claude-opus-5-5";
const DAILY_RUNS_VISITOR = Number(process.env.SANDBOX_FREE_RUNS_VISITOR || 20);
const DAILY_RUNS_SIGNED_IN = Number(process.env.SANDBOX_FREE_RUNS_SIGNED_IN || 100);
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_CHARS = 400000;

// USD per million tokens (input, output) for cost reporting
const PRICES = {
  "claude-opus-5-5": [4, 20],
  "claude-sonnet-5-5": [2, 10],
  "claude-haiku-5-5": [0.1, 0.5]
};
// Models that support server-side refusal fallback with the "default" form
const FALLBACK_MODELS = ["claude-opus-5-5", "claude-sonnet-5-5"];

const SYSTEM_PROMPT =
  "You are the live demo of a document question-answering product. Answer the user's question using only the attached document. " +
  "If the document does not contain the answer, say that plainly instead of guessing. Keep answers short and specific.";

let client = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic();
  return client;
}

function quotaSubject(req) {
  return req.user ? { token: sha256(`user:${req.user.id}`), limit: DAILY_RUNS_SIGNED_IN } : { token: sha256(`ip:${req.ip}`), limit: DAILY_RUNS_VISITOR };
}

async function runsToday(token) {
  return prisma.sandboxRun.count({ where: { sessionToken: token, createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
}

const runSchema = z
  .object({
    componentId: z.string().min(1).max(64),
    question: z.string().trim().min(3).max(2000),
    scenarioId: z.string().max(64).optional(),
    document: z
      .object({
        name: z.string().trim().min(1).max(200),
        mediaType: z.enum(["application/pdf", "text/plain"]),
        data: z.string().min(1)
      })
      .optional()
  })
  .refine((b) => Boolean(b.scenarioId) !== Boolean(b.document), { message: "Send either scenarioId or document" });

function documentBlock(body) {
  if (body.scenarioId) {
    const sample = SAMPLE_DOCUMENTS[body.scenarioId];
    if (!sample) return { error: "Unknown sample document" };
    return { block: { type: "document", source: { type: "text", media_type: "text/plain", data: sample.text }, title: sample.title, citations: { enabled: true } } };
  }
  const doc = body.document;
  if (doc.mediaType === "application/pdf") {
    const bytes = Buffer.byteLength(doc.data, "base64");
    if (bytes > MAX_PDF_BYTES) return { error: "PDF is larger than 10 MB" };
    if (!/^[A-Za-z0-9+/]+=*$/.test(doc.data)) return { error: "PDF data must be base64" };
    return { block: { type: "document", source: { type: "base64", media_type: "application/pdf", data: doc.data }, title: doc.name, citations: { enabled: true } } };
  }
  if (doc.data.length > MAX_TEXT_CHARS) return { error: "Text document is too long" };
  return { block: { type: "document", source: { type: "text", media_type: "text/plain", data: doc.data }, title: doc.name, citations: { enabled: true } } };
}

function citationView(c) {
  const base = { citedText: c.cited_text, documentTitle: c.document_title };
  if (c.type === "page_location") return { ...base, location: `Page ${c.start_page_number}` };
  if (c.type === "char_location") return { ...base, location: `Characters ${c.start_char_index}-${c.end_char_index}` };
  return base;
}

export function registerSandboxRoutes(app) {
  app.get("/api/sandbox/status", async (req, res, next) => {
    try {
      const { token, limit } = quotaSubject(req);
      res.json({ enabled: Boolean(getClient()), model: MODEL, dailyLimit: limit, usedToday: await runsToday(token) });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/sandbox/run", express.json({ limit: "15mb" }), async (req, res, next) => {
    let product;
    let body;
    let quota;
    try {
      body = validate(runSchema, req.body, req, res);
      if (!body) return;
      const anthropic = getClient();
      if (!anthropic) return res.status(503).json({ error: "The live sandbox is not configured on this server", requestId: req.requestId });

      product = await prisma.product.findUnique({ where: { slug: body.componentId } });
      if (!product || product.status !== "PUBLISHED") return res.status(404).json({ error: "Product not found", requestId: req.requestId });

      quota = quotaSubject(req);
      if ((await runsToday(quota.token)) >= quota.limit) {
        return res.status(429).json({ error: `Daily sandbox limit of ${quota.limit} runs reached${req.user ? "" : ". Sign in for more runs"}`, requestId: req.requestId });
      }

      const doc = documentBlock(body);
      if (doc.error) return res.status(400).json({ error: doc.error, requestId: req.requestId });

      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "X-Accel-Buffering": "no" });
      const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

      const started = Date.now();
      const params = {
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort: "low" },
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: [doc.block, { type: "text", text: body.question }] }]
      };
      if (FALLBACK_MODELS.includes(MODEL)) {
        params.betas = ["server-side-fallback-2026-07-01"];
        params.fallbacks = "default";
      }
      const stream = anthropic.beta.messages.stream(params);
      res.on("close", () => {
        if (!res.writableEnded) stream.abort();
      });

      let status = "COMPLETED";
      let usage = { input_tokens: 0, output_tokens: 0 };
      let servedBy = MODEL;
      let doneEvent = null;
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") send("text", { text: event.delta.text });
        }
        const final = await stream.finalMessage();
        usage = final.usage;
        servedBy = final.model;
        if (final.stop_reason === "refusal") {
          status = "REFUSED";
          send("error", { error: "The model declined to answer this request." });
        } else {
          const citations = final.content.filter((b) => b.type === "text").flatMap((b) => b.citations || []).map(citationView);
          const [inPrice, outPrice] = PRICES[final.model] || PRICES[MODEL] || [0, 0];
          const costUsd = (usage.input_tokens * inPrice + usage.output_tokens * outPrice) / 1e6;
          doneEvent = {
            citations,
            model: final.model,
            latencyMs: Date.now() - started,
            inputTokens: usage.input_tokens,
            outputTokens: usage.output_tokens,
            costUsd: Number(costUsd.toFixed(4))
          };
        }
      } catch (err) {
        status = "FAILED";
        if (!res.writableEnded) {
          const busy = err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError;
          send("error", { error: busy ? "The model is busy. Try again in a moment." : "The sandbox run failed.", requestId: req.requestId });
        }
        if (!(err instanceof Anthropic.APIUserAbortError)) console.error(`[sandbox] ${req.requestId}:`, err.message);
      }

      // Record the run and usage before finishing the response, so the client sees them immediately
      const [inPrice, outPrice] = PRICES[servedBy] || PRICES[MODEL] || [0, 0];
      const buyer = findMembership(req, "BUYER");
      const run = await prisma.sandboxRun.create({
        data: {
          productId: product.id,
          sessionToken: quota.token,
          userId: req.user?.id,
          workspaceId: buyer?.workspaceId,
          durationMs: Date.now() - started,
          tokenCount: (usage.input_tokens || 0) + (usage.output_tokens || 0),
          costMinor: Math.ceil(((usage.input_tokens || 0) * inPrice + (usage.output_tokens || 0) * outPrice) / 1e4),
          currency: "USD",
          status,
          inputPurgedAt: new Date() // the document was never stored
        }
      });
      if (buyer && status === "COMPLETED") {
        await prisma.usageEvent.create({
          data: {
            workspaceId: buyer.workspaceId,
            productId: product.id,
            idempotencyKey: `sandbox:${run.id}`,
            eventType: "SANDBOX_RUN",
            units: run.tokenCount || 0
          }
        });
      }
      if (doneEvent && !res.writableEnded) send("done", doneEvent);
      res.end();
    } catch (err) {
      if (res.headersSent) {
        console.error(`[sandbox] ${req.requestId}:`, err.message);
        if (!res.writableEnded) res.end();
      } else {
        next(err);
      }
    }
  });
}
