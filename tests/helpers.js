/**
 * Shared test helpers: start the app on a random port and make cookie-keeping clients.
 */

import { before, after } from "node:test";
import assert from "node:assert/strict";
import { app, prisma } from "../server/server.js";

export const PASSWORD = process.env.SEED_DEMO_PASSWORD;
export { prisma };

let server;
let base;

export function useServer() {
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
}

// Minimal client that keeps the session cookie between calls
export function client() {
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

export async function signedIn(email) {
  const call = client();
  const res = await call("POST", "/api/auth/login", { email, password: PASSWORD });
  assert.equal(res.status, 200, `login ${email}`);
  return call;
}
