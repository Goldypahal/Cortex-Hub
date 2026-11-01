/**
 * Cortex Hub - Live Sandbox View Controller (SRS SBX-01..05)
 * Streams real answers with citations from the server's sandbox endpoint. When the
 * server has no model configured, it shows recorded sample answers, labelled as such.
 */

import { DEMO_SCENARIOS } from "../data/demo-scenarios.js";
import { escapeHtml, showToast } from "../utils/helpers.js";

const esc = escapeHtml;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export class PlaygroundView {
  constructor(app) {
    this.app = app;
    this.scenarios = DEMO_SCENARIOS;
    this.activeScenario = this.scenarios[0];
    this.componentId = "rag-chatbot";
    this.upload = null; // { name, mediaType, data }
    this.isStreaming = false;
    this.status = null;
  }

  async render(container) {
    this.container = container;
    const [components, status] = await Promise.all([
      this.app.api.getComponents(),
      this.app.api.getSandboxStatus().catch(() => ({ enabled: false }))
    ]);
    this.components = components;
    this.status = status;
    if (!components.some((c) => c.id === this.componentId) && components[0]) this.componentId = components[0].id;
    const live = status.enabled;

    container.innerHTML = `
      <div class="playground-container">
        <div class="playground-header">
          <div class="playground-title-area">
            <h2>Live Sandbox</h2>
            <p>Ask questions about a document and get answers with citations into the source. Uploaded files are used for one request and never stored.</p>
          </div>
          <span class="badge ${live ? "badge-lime" : "badge-amber"}">
            ${live ? `LIVE · ${esc(status.model)}` : "SAMPLE MODE · live sandbox not configured on this server"}
          </span>
        </div>

        <div class="playground-workspace">
          <div class="playground-controls-panel">
            <div class="card">
              <label class="form-label" for="sandbox-product" style="margin-bottom: 6px;">[01] PRODUCT</label>
              <select id="sandbox-product" class="select-input">
                ${components.map((c) => `<option value="${esc(c.id)}" ${c.id === this.componentId ? "selected" : ""}>${esc(c.name)}</option>`).join("")}
              </select>
              ${live ? `<p style="font-size: 0.74rem; color: var(--text-muted); margin-top: 8px;">Runs today: ${esc(status.usedToday)} of ${esc(status.dailyLimit)}${this.app.currentUser ? "" : " (sign in for more)"}</p>` : ""}
            </div>

            <div class="card">
              <span class="form-label" style="margin-bottom: 6px;">[02] YOUR DOCUMENT</span>
              <div class="dropzone" id="playground-dropzone" role="button" tabindex="0" aria-label="Upload a PDF or text file">
                <div class="dropzone-icon">// DROP FILE</div>
                <div class="dropzone-text">Click or drag a PDF or .txt file</div>
                <div class="dropzone-subtext">Max 10 MB. Used for this request only, never stored.</div>
                <input type="file" id="playground-file-input" style="display: none;" accept=".pdf,.txt,.md,application/pdf,text/plain" />
              </div>
              <div id="upload-status" style="margin-top: 8px; font-family: var(--font-mono); font-size: 0.74rem; color: var(--accent-lime);" ${this.upload ? "" : "hidden"}>
                Using <strong id="upload-name">${esc(this.upload?.name || "")}</strong> <button class="btn btn-ghost btn-sm" id="btn-clear-upload" type="button">Remove</button>
              </div>
            </div>

            <div class="card">
              <span class="form-label" style="margin-bottom: 6px;">[03] OR A SAMPLE DOCUMENT</span>
              <p style="font-size: 0.74rem; color: var(--text-muted); margin-bottom: 8px;">Short fictional documents written for this demo.</p>
              <div class="scenarios-grid">
                ${this.scenarios
                  .map(
                    (s) => `
                  <div class="scenario-chip ${!this.upload && s.id === this.activeScenario.id ? "active" : ""}" data-id="${esc(s.id)}" role="button" tabindex="0">
                    <div class="scenario-info">
                      <span class="scenario-title">${esc(s.title.replace(/ \((PDF|DOCX|OpenAPI)\)$/, ""))}</span>
                      <span class="scenario-meta">${esc(s.industry)}</span>
                    </div>
                  </div>`
                  )
                  .join("")}
              </div>
            </div>
          </div>

          <div class="playground-chat-panel">
            <div class="chat-panel-topbar">
              <div class="active-doc-badge">
                <span>[DOC]</span>
                <span id="active-doc-title">${esc(this.upload ? this.upload.name : `${this.activeScenario.title.replace(/ \((PDF|DOCX|OpenAPI)\)$/, "")} (fictional sample)`)}</span>
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-clear-chat">Clear</button>
            </div>

            <div class="chat-feed" id="chat-feed" aria-live="polite">
              <div class="chat-bubble assistant">
                <div class="chat-avatar assistant">AI</div>
                <div class="chat-content">${
                  live
                    ? "Ask a question about the selected document. Answers are generated live and cite the passages they rely on."
                    : "The live sandbox is not configured on this server, so answers below are <strong>recorded samples</strong>, not generated live. Uploads are disabled in sample mode."
                }</div>
              </div>
            </div>

            <div class="chat-input-container">
              <div class="suggested-prompts" id="suggested-prompts">${this.promptPills()}</div>
              <form class="chat-input-form" id="chat-form">
                <input type="text" id="chat-query-input" class="chat-input-field" placeholder="Ask about the document…" value="${esc(this.upload ? "" : this.activeScenario.defaultQuestion)}" autocomplete="off" maxlength="2000" aria-label="Question" />
                <button type="submit" class="btn btn-primary" id="btn-send-chat" style="padding: 0 16px;">Ask →</button>
              </form>
            </div>

            <div class="telemetry-strip">
              <div class="telemetry-metrics">
                <div class="telemetry-metric"><span>LATENCY:</span><span class="metric-value" id="telem-latency">—</span></div>
                <div class="telemetry-metric"><span>INPUT:</span><span class="metric-value" id="telem-prompt">—</span></div>
                <div class="telemetry-metric"><span>OUTPUT:</span><span class="metric-value" id="telem-completion">—</span></div>
                <div class="telemetry-metric"><span>COST:</span><span class="metric-value" id="telem-cost">—</span></div>
              </div>
              <div style="font-family: var(--font-mono); color: var(--text-muted); font-size: 0.7rem;" id="telem-model">${live ? esc(status.model) : "recorded sample"}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents(container);
  }

  promptPills() {
    if (this.upload) return "";
    return this.activeScenario.sampleQuestions
      .map((q) => `<button type="button" class="prompt-pill" data-prompt="${esc(q)}">// ${esc(q)}</button>`)
      .join("");
  }

  attachEvents(container) {
    container.querySelector("#sandbox-product").addEventListener("change", (e) => {
      this.componentId = e.target.value;
    });

    container.querySelectorAll(".scenario-chip").forEach((chip) => {
      const select = () => {
        this.activeScenario = this.scenarios.find((s) => s.id === chip.dataset.id) || this.activeScenario;
        this.upload = null;
        this.render(container);
      };
      chip.addEventListener("click", select);
      chip.addEventListener("keydown", (e) => e.key === "Enter" && select());
    });

    const dropzone = container.querySelector("#playground-dropzone");
    const fileInput = container.querySelector("#playground-file-input");
    dropzone.addEventListener("click", () => fileInput.click());
    dropzone.addEventListener("keydown", (e) => e.key === "Enter" && fileInput.click());
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      if (e.dataTransfer.files?.[0]) this.useFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener("change", (e) => e.target.files?.[0] && this.useFile(e.target.files[0]));

    const clearUpload = container.querySelector("#btn-clear-upload");
    if (clearUpload) {
      clearUpload.addEventListener("click", (e) => {
        e.stopPropagation();
        this.upload = null;
        this.render(container);
      });
    }

    container.querySelectorAll(".prompt-pill").forEach((p) =>
      p.addEventListener("click", () => {
        container.querySelector("#chat-query-input").value = p.dataset.prompt;
        this.submitQuery(p.dataset.prompt, container);
      })
    );

    container.querySelector("#chat-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const query = container.querySelector("#chat-query-input").value.trim();
      if (query && !this.isStreaming) this.submitQuery(query, container);
    });

    container.querySelector("#btn-clear-chat").addEventListener("click", () => {
      container.querySelector("#chat-feed").innerHTML = "";
    });
  }

  async useFile(file) {
    if (!this.status?.enabled) {
      showToast("Uploads need the live sandbox, which is not configured on this server.", "info");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      showToast("File is larger than 10 MB.", "warning");
      return;
    }
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const isText = file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name);
    if (!isPdf && !isText) {
      showToast("Upload a PDF or a plain-text file. Word documents are not supported; save as PDF first.", "warning");
      return;
    }
    try {
      this.upload = isPdf
        ? { name: file.name, mediaType: "application/pdf", data: await readAsBase64(file) }
        : { name: file.name, mediaType: "text/plain", data: await file.text() };
      await this.render(this.container);
      this.container.querySelector("#chat-query-input").focus();
    } catch {
      showToast("Could not read that file.", "error");
    }
  }

  addBubble(feed, role, html) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${role}`;
    bubble.innerHTML = `<div class="chat-avatar ${role}">${role === "user" ? "YOU" : "AI"}</div><div class="chat-content">${html}</div>`;
    feed.appendChild(bubble);
    feed.scrollTop = feed.scrollHeight;
    return bubble.querySelector(".chat-content");
  }

  renderCitations(citations) {
    if (!citations.length)
      return `<div style="margin-top: 10px; font-size: 0.78rem; color: var(--text-muted);">No citations returned for this answer.</div>`;
    return `
      <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-medium);">
        <div style="font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700; color: var(--accent-lime); margin-bottom: 6px;">// CITATIONS (${citations.length})</div>
        ${citations
          .map(
            (c) => `<div class="citation-box">
          <div class="citation-header"><span>${esc(c.documentTitle || "Document")}${c.location ? ` · ${esc(c.location)}` : ""}</span></div>
          <div class="citation-excerpt">"${esc(c.citedText)}"</div>
        </div>`
          )
          .join("")}
      </div>`;
  }

  setTelemetry(container, { latencyMs, inputTokens, outputTokens, costUsd, model }) {
    container.querySelector("#telem-latency").textContent = latencyMs != null ? `${latencyMs} ms` : "—";
    container.querySelector("#telem-prompt").textContent =
      inputTokens != null ? `${inputTokens.toLocaleString()} tok` : "—";
    container.querySelector("#telem-completion").textContent =
      outputTokens != null ? `${outputTokens.toLocaleString()} tok` : "—";
    container.querySelector("#telem-cost").textContent = costUsd != null ? `$${costUsd}` : "—";
    if (model) container.querySelector("#telem-model").textContent = model;
  }

  async submitQuery(query, container) {
    const feed = container.querySelector("#chat-feed");
    const sendBtn = container.querySelector("#btn-send-chat");
    this.addBubble(feed, "user", esc(query));
    container.querySelector("#chat-query-input").value = "";

    if (!this.status?.enabled) {
      // Recorded sample (no model configured on the server)
      const sample = this.activeScenario.simulatedResponse;
      const box = this.addBubble(feed, "assistant", "");
      box.innerHTML = `<div class="badge badge-amber" style="margin-bottom: 8px;">RECORDED SAMPLE, NOT GENERATED LIVE</div><div>${esc(sample.answer)}</div>${this.renderCitations(
        sample.citations.map((c) => ({ documentTitle: c.docTitle, location: `Page ${c.pageNo}`, citedText: c.excerpt }))
      )}`;
      this.setTelemetry(container, { model: "recorded sample" });
      return;
    }

    this.isStreaming = true;
    sendBtn.disabled = true;
    const box = this.addBubble(
      feed,
      "assistant",
      `<span style="color: var(--text-muted);">Reading the document…</span>`
    );
    const answer = document.createElement("div");
    answer.style.whiteSpace = "pre-wrap";
    let started = false;

    const payload = { componentId: this.componentId, question: query };
    if (this.upload) payload.document = this.upload;
    else payload.scenarioId = this.activeScenario.id;

    try {
      await this.app.api.runSandbox(payload, {
        onText: (text) => {
          if (!started) {
            box.innerHTML = "";
            box.appendChild(answer);
            started = true;
          }
          answer.textContent += text;
          feed.scrollTop = feed.scrollHeight;
        },
        onDone: (result) => {
          box.insertAdjacentHTML("beforeend", this.renderCitations(result.citations));
          this.setTelemetry(container, result);
          if (this.status) this.status.usedToday += 1;
        },
        onError: (message) => {
          box.insertAdjacentHTML(
            "beforeend",
            `<div style="color: var(--status-error); margin-top: 8px;">${esc(message)}</div>`
          );
          if (!started) box.querySelector("span")?.remove();
        }
      });
    } catch (err) {
      box.innerHTML = `<div style="color: var(--status-error);">${esc(err.message)}</div>`;
    } finally {
      this.isStreaming = false;
      sendBtn.disabled = false;
      feed.scrollTop = feed.scrollHeight;
    }
  }
}
