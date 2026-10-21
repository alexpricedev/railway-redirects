import { describe, expect, test } from "bun:test";
import { ConfigError, loadConfig, normaliseHost, parseConfig } from "./config";

describe("parseConfig", () => {
  test("maps each host and its www. subdomain to the target", () => {
    const redirects = parseConfig(
      JSON.stringify({ "example.com": "https://github.com/your-name/example" }),
    );
    expect(redirects.get("example.com")).toBe("https://github.com/your-name/example");
    expect(redirects.get("www.example.com")).toBe("https://github.com/your-name/example");
    expect(redirects.size).toBe(2);
  });

  test("normalises host case", () => {
    const redirects = parseConfig(JSON.stringify({ "Example.COM": "https://a.dev" }));
    expect(redirects.get("example.com")).toBe("https://a.dev");
  });

  test.each([
    ["invalid JSON", "{nope"],
    ["an array", "[]"],
    ["an empty object", "{}"],
    ["a www. host", JSON.stringify({ "www.a.com": "https://b.dev" })],
    ["a bad hostname", JSON.stringify({ "not a host": "https://b.dev" })],
    ["a non-string target", JSON.stringify({ "a.com": 1 })],
    ["a relative target", JSON.stringify({ "a.com": "/path" })],
    ["a non-http target", JSON.stringify({ "a.com": "ftp://b.dev" })],
    ["a duplicate host", '{"a.com":"https://b.dev","A.com":"https://c.dev"}'],
  ])("rejects %s", (_, raw) => {
    expect(() => parseConfig(raw)).toThrow(ConfigError);
  });
});

describe("normaliseHost", () => {
  test("strips port and trailing dot", () => {
    expect(normaliseHost("Example.com.:8080")).toBe("example.com");
  });
});

describe("loadConfig", () => {
  test("prefers the REDIRECTS env var", async () => {
    const redirects = await loadConfig(
      { REDIRECTS: '{"a.com":"https://b.dev"}' },
      "does-not-exist.json",
    );
    expect(redirects.get("a.com")).toBe("https://b.dev");
  });

  test("throws when there is no env var or file", async () => {
    expect(loadConfig({}, "does-not-exist.json")).rejects.toThrow(ConfigError);
  });
});
