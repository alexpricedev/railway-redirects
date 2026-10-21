/**
 * Redirect config: a JSON object mapping a bare host to an absolute target URL.
 *
 *   { "wanthave.trade": "https://github.com/you/wanthave-trade" }
 *
 * Each host also matches its `www.` subdomain automatically.
 */

export type Redirects = ReadonlyMap<string, string>;

export class ConfigError extends Error {
  constructor(message: string) {
    super(`Invalid redirect config: ${message}`);
    this.name = "ConfigError";
  }
}

const HOSTNAME =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]$/;

/** Lowercase, trim, and drop any port or trailing dot. */
export function normaliseHost(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

/**
 * Parse and validate raw JSON config into a lookup map that includes the
 * automatic `www.` entries. Throws ConfigError on anything invalid.
 */
export function parseConfig(raw: string): Redirects {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new ConfigError(`not valid JSON (${(err as Error).message})`);
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new ConfigError('expected an object like { "example.com": "https://..." }');
  }

  const entries = Object.entries(data);
  if (entries.length === 0) {
    throw new ConfigError("no redirects defined");
  }

  const redirects = new Map<string, string>();

  for (const [rawHost, target] of entries) {
    const host = normaliseHost(rawHost);

    if (host.startsWith("www.")) {
      throw new ConfigError(
        `"${rawHost}": list the bare domain only, www. is matched automatically`,
      );
    }
    if (!HOSTNAME.test(host)) {
      throw new ConfigError(`"${rawHost}" is not a valid hostname`);
    }
    if (typeof target !== "string") {
      throw new ConfigError(`"${rawHost}": target must be a string URL`);
    }

    let url: URL;
    try {
      url = new URL(target);
    } catch {
      throw new ConfigError(`"${rawHost}": "${target}" is not an absolute URL`);
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new ConfigError(`"${rawHost}": target must use http or https`);
    }

    for (const key of [host, `www.${host}`]) {
      if (redirects.has(key)) {
        throw new ConfigError(`"${rawHost}" is listed more than once`);
      }
      redirects.set(key, target);
    }
  }

  return redirects;
}

/**
 * Load config from the REDIRECTS env var, falling back to ./redirects.json
 * for local development.
 */
export async function loadConfig(
  env: Record<string, string | undefined> = process.env,
  filePath = "redirects.json",
): Promise<Redirects> {
  const fromEnv = env.REDIRECTS?.trim();
  if (fromEnv) return parseConfig(fromEnv);

  const file = Bun.file(filePath);
  if (await file.exists()) return parseConfig(await file.text());

  throw new ConfigError(
    `set the REDIRECTS env var or create ${filePath} (see redirects.example.json)`,
  );
}
