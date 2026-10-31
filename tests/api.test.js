/**
 * API integration tests (node:test). Needs a migrated + seeded database:
 *   DATABASE_URL=... SEED_DEMO_PASSWORD=... npm test
 */

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "crypto";
import { app, prisma } from "../server/server.js";

const PASSWORD = process.env.SEED_DEMO_PASSWORD;
let server;
let base;

before(async () => {
  assert.ok(PASSWORD, "Set SEED_DEMO_PASSWORD to the demo accounts' password");
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

// Minimal client that keeps the session cookie between calls
function client() {
  let cookie = "";
  return async (method, path, body, headers = {}) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(cookie && { Cookie: cookie }),
        ...headers
      },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body)
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
    return { status: res.status, body: json, headers: res.headers };
  };
}

async function signedIn(email) {
  const call = client();
  const res = await call("POST", "/api/auth/login", { email, password: PASSWORD });
  assert.equal(res.status, 200, `login ${email}`);
  return call;
}

test("health and public catalog are open", async () => {
  const call = client();
  assert.equal((await call("GET", "/api/health")).status, 200);
  const list = await call("GET", "/api/components");
  assert.equal(list.status, 200);
  assert.ok(list.body.length >= 10);
});

test("protected routes reject anonymous callers", async () => {
  const call = client();
  for (const [method, path, body] of [
    ["GET", "/api/licenses"],
    ["GET", "/api/api-keys"],
    ["GET", "/api/tickets"],
    ["GET", "/api/tenant"],
    ["GET", "/api/customization-requests"],
    ["POST", "/api/components", {}],
    ["DELETE", "/api/components/rag-chatbot"],
    ["POST", "/api/licenses/checkout", { componentId: "rag-chatbot" }],
    ["GET", "/api/moderation/queue"],
    ["GET", "/api/analytics/revenue"]
  ]) {
    assert.equal((await call(method, path, body)).status, 401, `${method} ${path}`);
  }
});

test("login rejects a wrong password without revealing details", async () => {
  const res = await client()("POST", "/api/auth/login", { email: "buyer@acme-health.test", password: "wrong-password" });
  assert.equal(res.status, 401);
  assert.equal(res.body.error, "Invalid email or password");
});

test("state-changing calls must be JSON", async () => {
  const res = await client()("POST", "/api/auth/login", "email=a&password=b", {
    "Content-Type": "application/x-www-form-urlencoded"
  });
  assert.equal(res.status, 415);
});

test("buyer can use their own portal but not staff routes", async () => {
  const buyer = await signedIn("buyer@acme-health.test");

  const me = await buyer("GET", "/api/auth/me");
  assert.equal(me.status, 200);
  assert.equal(me.body.user.passwordHash, undefined);

  assert.equal((await buyer("GET", "/api/licenses")).status, 200);
  assert.equal((await buyer("GET", "/api/tenant")).status, 200);

  const key = await buyer("POST", "/api/api-keys", { name: "CI key", environment: "Staging" });
  assert.equal(key.status, 201);
  assert.match(key.body.key, /^ctx_test_[0-9a-f]{48}$/);
  assert.equal(key.body.keyHash, undefined);
  const keys = await buyer("GET", "/api/api-keys");
  assert.ok(keys.body.every((k) => k.keyHash === undefined));

  const lic = await buyer("POST", "/api/licenses/checkout", { componentId: "rag-chatbot", tier: "Starter" });
  assert.equal(lic.status, 201);
  assert.match(lic.body.license.licenseKey, /^LIC-RAG--[0-9A-F]{6}-[0-9A-F]{6}$/);

  assert.equal((await buyer("POST", "/api/tickets", { subject: "Test ticket", message: "hi" })).status, 201);
  assert.equal((await buyer("POST", "/api/customization-requests", { componentId: "rag-chatbot" })).status, 201);

  assert.equal((await buyer("POST", "/api/components", { id: "x" })).status, 403);
  assert.equal((await buyer("DELETE", "/api/components/rag-chatbot")).status, 403);
  assert.equal((await buyer("GET", "/api/moderation/queue")).status, 403);
  assert.equal((await buyer("GET", "/api/analytics/revenue")).status, 403);
  assert.equal((await buyer("POST", "/api/products/submit", { name: "x" })).status, 403);
});

test("seller can submit products but not use buyer routes", async () => {
  const seller = await signedIn("seller@apex-ai.test");
  const sub = await seller("POST", "/api/products/submit", { name: "Test MCP", basePrice: 99 });
  assert.equal(sub.status, 201);
  assert.match(sub.body.moderation.checklist.malwareScan, /^PENDING/);
  assert.equal((await seller("GET", "/api/licenses")).status, 403);
});

test("admin can manage catalog and validation rejects bad input", async () => {
  const admin = await signedIn("admin@cortex-hub.test");
  assert.equal((await admin("GET", "/api/analytics/revenue")).status, 200);
  assert.equal((await admin("GET", "/api/moderation/queue")).status, 200);

  const bad = await admin("POST", "/api/components", { id: "Bad Id!", name: "" });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.issues.length > 0);

  const requests = await admin("GET", "/api/customization-requests");
  assert.equal(requests.status, 200);
  const patched = await admin("PATCH", `/api/customization-requests/${requests.body[0].id}`, {
    status: "Under Review",
    statusStep: 2,
    timelineEvent: "Picked up by test"
  });
  assert.equal(patched.status, 200);
  assert.equal(patched.body.status, "Under Review");
});

test("one buyer workspace cannot see or change another's data", async () => {
  const buyerA = await signedIn("buyer@acme-health.test");
  const keyA = await buyerA("POST", "/api/api-keys", { name: "A only" });
  const ticketA = await buyerA("POST", "/api/tickets", { subject: "A private" });

  const buyerB = client();
  const reg = await buyerB("POST", "/api/auth/register", {
    name: "Test Buyer",
    email: `buyer-${randomBytes(4).toString("hex")}@example.test`,
    password: "correct-horse-battery",
    workspaceName: "Other Co"
  });
  assert.equal(reg.status, 201);

  const keysB = await buyerB("GET", "/api/api-keys");
  assert.ok(!keysB.body.some((k) => k.id === keyA.body.id));
  assert.equal((await buyerB("DELETE", `/api/api-keys/${keyA.body.id}`)).status, 404);
  const ticketsB = await buyerB("GET", "/api/tickets");
  assert.ok(!ticketsB.body.some((t) => t.id === ticketA.body.id));
  assert.equal((await buyerB("GET", "/api/licenses")).body.length, 0);
});

test("logout ends the session", async () => {
  const buyer = await signedIn("buyer@acme-health.test");
  assert.equal((await buyer("POST", "/api/auth/logout", {})).status, 200);
  assert.equal((await buyer("GET", "/api/auth/me")).body.user, null);
  assert.equal((await buyer("GET", "/api/licenses")).status, 401);
});

test("only public frontend files are served", async () => {
  const call = client();
  const home = await call("GET", "/");
  assert.equal(home.status, 200);
  assert.match(String(home.headers.get("content-type")), /text\/html/);
  assert.equal((await call("GET", "/js/app.js")).status, 200);
  for (const path of ["/.env", "/.env.example", "/server/server.js", "/package.json", "/server/prisma/schema.prisma"]) {
    assert.equal((await call("GET", path)).status, 404, path);
  }
});

test("repeated failed logins are throttled", async () => {
  const call = client();
  const email = `nobody-${randomBytes(4).toString("hex")}@example.test`;
  for (let i = 0; i < 5; i++) {
    assert.equal((await call("POST", "/api/auth/login", { email, password: "wrong" })).status, 401);
  }
  assert.equal((await call("POST", "/api/auth/login", { email, password: "wrong" })).status, 429);
});
