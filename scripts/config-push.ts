/**
 * Validate redirects.json, minify it, and set it as the REDIRECTS variable
 * on the linked Railway service using the Railway CLI. Railway redeploys
 * the service with the new config.
 *
 * Any arguments are passed through to `railway variable set`, for example:
 *   bun run config:push --service redirects
 */
import { readMinifiedConfig } from "./read-config";

const { minified, count } = await readMinifiedConfig();

let railway;
try {
  railway = Bun.spawn(
    ["railway", "variable", "set", "REDIRECTS", "--stdin", ...process.argv.slice(2)],
    { stdin: "pipe", stdout: "inherit", stderr: "inherit" },
  );
} catch {
  console.error("Railway CLI not found. Install it from https://docs.railway.com/cli");
  process.exit(1);
}

railway.stdin.write(minified);
railway.stdin.end();

const code = await railway.exited;
if (code !== 0) {
  console.error("Setting REDIRECTS failed (is this directory linked? run `railway link`)");
  process.exit(code);
}

console.log(`Set REDIRECTS with ${count} redirect(s). Railway will redeploy the service.`);
