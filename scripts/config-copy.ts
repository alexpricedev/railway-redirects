/**
 * Validate redirects.json, minify it, and copy it to the clipboard
 * ready to paste into the REDIRECTS variable in Railway.
 */
import { readMinifiedConfig } from "./read-config";

const { minified, count } = await readMinifiedConfig(process.argv[2]);

const pbcopy = Bun.spawn(["pbcopy"], { stdin: "pipe" });
pbcopy.stdin.write(minified);
pbcopy.stdin.end();

if ((await pbcopy.exited) !== 0) {
  console.error("pbcopy failed");
  process.exit(1);
}

console.log(
  `Copied ${count} redirect(s) to the clipboard. Paste it as the value of REDIRECTS in Railway.`,
);
