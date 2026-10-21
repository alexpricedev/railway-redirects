# railway-redirects

A tiny Bun service that redirects whole domains to other URLs. Point any number of custom domains at one Railway service, and each one sends every request to its configured target with a permanent `308` redirect.

Useful for retired projects (send the old domain to its GitHub repo), renamed products, or parked domains.

## How it works

- Config is a JSON object mapping a bare domain to a target URL.
- Each domain also matches its `www.` subdomain automatically.
- Every request to a configured host gets a `308` to the target, whatever the path, query or method.
- `/healthz` on any other host returns `200` (used for Railway's health check). Anything else is a `404`.
- Config is validated at startup. If it's missing or invalid, the service exits instead of serving broken redirects.

## Config

The real config is never committed. The service reads it from:

1. the `REDIRECTS` environment variable (production), or
2. `redirects.json` in the project root (local development, gitignored).

```json
{
  "example.com": "https://github.com/your-name/example",
  "old-project.dev": "https://new-project.dev"
}
```

Rules:

- Keys are bare domains. Don't list `www.` versions; they're matched automatically.
- Each domain may appear only once (case-insensitive).
- Targets must be absolute `http://` or `https://` URLs.

## Local development

```sh
bun install
cp redirects.example.json redirects.json
bun run dev
```

Test a redirect by sending a `Host` header:

```sh
curl -i -H "Host: example.com" localhost:3000
```

Run the tests and typecheck:

```sh
bun test
bun run typecheck
```

## Deploying to Railway

Deploys use the [Railway CLI](https://docs.railway.com/cli). Install it and log in:

```sh
railway login
```

First deploy:

1. Create a project with `railway init`, or connect to an existing one with `railway link`.
2. Add an empty service with `railway add` and pick it when prompted.
3. Run `bun run config:copy`. It validates `redirects.json`, minifies it, and copies it to your clipboard (macOS).
4. In the Railway dashboard, paste it as the value of a `REDIRECTS` variable on the service.
5. Deploy the current directory:

   ```sh
   railway up
   ```

Railway detects Bun and runs the `start` script from `package.json`. To have Railway wait for the service to be healthy before switching traffic, set the health check path to `/healthz` in the service's settings.

`redirects.json` is gitignored, so `railway up` doesn't upload it. Production config only ever comes from the `REDIRECTS` variable.

To change redirects later, edit `redirects.json`, run `bun run config:copy` again, and replace the variable's value. Railway redeploys with the new config.

## Adding a domain

For each domain in your config:

1. Add the domain (and its `www.` version, if you want it to work) as a custom domain, either in the service's settings or with `railway domain example.com`.
2. At your DNS provider, add the records Railway shows: a CNAME (or ALIAS/flattened CNAME at the root) to Railway's target, plus the verification TXT record.
3. Railway issues the TLS certificate once DNS resolves.

Notes:

- Railway limits custom domains per service, and the root and `www.` count separately. If you don't need `www.`, skip it to save a slot.
- If something upstream already redirects `www.` to the root domain, only the root needs adding to Railway.
- Behind Cloudflare's proxy, set SSL/TLS mode to **Full**. Flexible causes a redirect loop.
- `308` is permanent and browsers cache it, so treat each redirect as final.
