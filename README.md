# doughboys

To install dependencies:

```bash
bun install
```

To run locally:

```bash
bun run dev
```

To typecheck:

```bash
bun run check
```

To build for production:

```bash
bun run build
```

To run the production server:

```bash
bun run start
```

## Coolify

This app uses `@sveltejs/adapter-node`, so deploy it as a Node server, not a static site.

- Static: `Off`
- Install command: `bun install --frozen-lockfile`
- Build command: `bun run build`
- Start command: `bun run start`

Required runtime environment variables:

```bash
PUBLIC_SENTRY_DSN=...
GOOGLE_API_KEY=...
```

Optional build-time environment variables for Sentry source map upload:

```bash
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=...
SENTRY_PROJECT=...
```

This project was created using `bun init` in bun v1.3.9. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
