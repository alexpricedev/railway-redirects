import { ConfigError, loadConfig } from "./config";
import { createHandler } from "./handler";

let redirects;
try {
  redirects = await loadConfig();
} catch (err) {
  if (err instanceof ConfigError) {
    console.error(err.message);
    process.exit(1);
  }
  throw err;
}

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  fetch: createHandler(redirects),
});

const domains = [...redirects.keys()].filter((host) => !host.startsWith("www."));
console.log(`Redirecting ${domains.length} domain(s) on port ${server.port}`);
