import { ConfigError, parseConfig } from "../src/config";

/**
 * Read and validate a redirects file, returning it minified for the
 * REDIRECTS variable. Exits with a readable error if anything is wrong.
 */
export async function readMinifiedConfig(
  filePath = "redirects.json",
): Promise<{ minified: string; count: number }> {
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

  const data = JSON.parse(raw) as Record<string, string>;
  return { minified: JSON.stringify(data), count: Object.keys(data).length };
}
