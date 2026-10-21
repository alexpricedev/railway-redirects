import { describe, expect, test } from "bun:test";
import { parseConfig } from "./config";
import { createHandler } from "./handler";

const handler = createHandler(
  parseConfig(JSON.stringify({ "wanthave.trade": "https://github.com/you/wanthave-trade" })),
);

const request = (url: string, init?: RequestInit) => handler(new Request(url, init));

describe("handler", () => {
  test("redirects a known host with a 308", () => {
    const res = request("https://wanthave.trade/");
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://github.com/you/wanthave-trade");
  });

  test("redirects www. and ignores the path and query", () => {
    const res = request("https://www.wanthave.trade/some/page?x=1");
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe("https://github.com/you/wanthave-trade");
  });

  test("uses the Host header and ignores case and port", () => {
    const res = request("http://localhost:3000/", {
      headers: { Host: "WantHave.Trade:443" },
    });
    expect(res.status).toBe(308);
  });

  test("redirects any method", () => {
    expect(request("https://wanthave.trade/", { method: "POST" }).status).toBe(308);
  });

  test("returns 200 on /healthz for unknown hosts", () => {
    expect(request("https://app.up.railway.app/healthz").status).toBe(200);
  });

  test("returns 404 for unknown hosts", () => {
    expect(request("https://unknown.com/").status).toBe(404);
  });
});
