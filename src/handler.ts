import { normaliseHost, type Redirects } from "./config";

/**
 * Build the request handler for a set of redirects.
 *
 * - A known host gets a 308 to its target, whatever the path or method.
 * - /healthz on any other host returns 200 (for Railway's health check).
 * - Anything else is a 404.
 */
export function createHandler(redirects: Redirects) {
  return (req: Request): Response => {
    const url = new URL(req.url);
    const host = normaliseHost(req.headers.get("host") ?? url.hostname);
    const target = redirects.get(host);

    if (target) {
      return new Response(null, {
        status: 308,
        headers: { Location: target },
      });
    }

    if (url.pathname === "/healthz") {
      return new Response("ok", { status: 200 });
    }

    return new Response("Not found", { status: 404 });
  };
}
