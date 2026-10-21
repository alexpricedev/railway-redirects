/**
 * Validate redirects.json, minify it, and copy it to the clipboard
 * ready to paste into the REDIRECTS variable in Railway.
 */
import { ConfigError, parseConfig } from "../src/config";

const filePath = process.argv[2] ?? "redirects.json";
const file = Bun.file(filePath);

if (!(await file.exists())) {
  console.error(`${filePath} not found (copy redirects.example.json to get started)`);
  process.exit(1);
}

const raw = await file.text();

try {
  parseConfig(raw);
} catch (err) {
  if (err instanceof ConfigError) {
    console.error(err.message);
    process.exit(1);
  }
  throw err;
}

const minified = JSON.stringify(JSON.parse(raw));
const domains = Object.keys(JSON.parse(raw)).length;

const pbcopy = Bun.spawn(["pbcopy"], { stdin: "pipe" });
pbcopy.stdin.write(minified);
pbcopy.stdin.end();

if ((await pbcopy.exited) !== 0) {
  console.error("pbcopy failed");
  process.exit(1);
}

console.log(
  `Copied ${domains} redirect(s) to the clipboard. Paste it as the value of REDIRECTS in Railway.`,
);
