# SnapLink

A fast, Redis-backed URL shortener service with analytics, QR code generation, and custom aliases. Built with Express, TypeScript, and Redis.

## Features

- **Short URLs** -- generate compact links with random IDs or custom aliases
- **Redirect tracking** -- every redirect records browser, OS, device, referrer, and IP
- **Analytics dashboard** -- clicks over time, top referrers, device/browser/OS/geo breakdowns
- **QR codes** -- generate PNG QR codes for any short link on the fly
- **Link expiration** -- optional TTL so links auto-expire
- **Rate limiting** -- Redis-backed per-IP rate limiter
- **Docker ready** -- single `docker compose up` spins up the app and Redis

## Tech Stack

- Node.js + Express
- TypeScript (strict mode)
- Redis 7
- nanoid (short ID generation)
- qrcode (QR PNG generation)
- ua-parser-js (user-agent parsing)

## Quick Start

### With Docker (recommended)

```bash
docker compose up --build
```

The API will be available at `http://localhost:3001`.

### Without Docker

Prerequisites: Node.js 18+, a running Redis instance.

```bash
# Install dependencies
npm install

# Copy environment file and adjust as needed
cp .env.example .env

# Build TypeScript
npm run build

# Start the server
npm start

# Or run in development mode with auto-reload
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | HTTP server port |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `BASE_URL` | `http://localhost:3001` | Public base URL for generated short links |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | Rate limit sliding window (seconds) |
| `RATE_LIMIT_MAX_REQUESTS` | `30` | Max requests per window per IP |

## API Reference

### Create a short link

```
POST /api/links
Content-Type: application/json

{
  "url": "https://example.com/some/long/path",
  "customAlias": "my-link",   // optional
  "expiresIn": 3600           // optional, seconds
}
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "shortId": "my-link",
    "originalUrl": "https://example.com/some/long/path",
    "shortUrl": "http://localhost:3001/my-link",
    "createdAt": "2026-03-29T12:00:00.000Z",
    "clicks": 0
  }
}
```

### List all links

```
GET /api/links
```

### Get basic stats

```
GET /api/links/:shortId/stats
```

Response:

```json
{
  "success": true,
  "data": {
    "shortId": "my-link",
    "originalUrl": "https://example.com/some/long/path",
    "clicks": 42,
    "createdAt": "2026-03-29T12:00:00.000Z"
  }
}
```

### Get detailed analytics

```
GET /api/analytics/:shortId
```

Response:

```json
{
  "success": true,
  "data": {
    "shortId": "my-link",
    "originalUrl": "https://example.com/some/long/path",
    "totalClicks": 42,
    "clicksOverTime": { "2026-03-29": 30, "2026-03-28": 12 },
    "topReferrers": { "https://twitter.com": 20, "direct": 22 },
    "browsers": { "Chrome": 25, "Firefox": 17 },
    "operatingSystems": { "Windows": 20, "macOS": 22 },
    "devices": { "desktop": 35, "mobile": 7 },
    "countries": { "Unknown": 42 }
  }
}
```

### Generate QR code

```
GET /api/links/:shortId/qr
```

Returns a `image/png` response.

### Redirect

```
GET /:shortId
```

Responds with `302` redirect to the original URL. Expired links return `410 Gone`.

### Health check

```
GET /health
```

## Project Structure

```
snaplink/
├── src/
│   ├── index.ts              Entry point
│   ├── config/
│   │   └── redis.ts          Redis client setup
│   ├── routes/
│   │   ├── links.ts          CRUD + QR endpoints
│   │   ├── analytics.ts      Detailed analytics endpoint
│   │   └── redirect.ts       Short URL redirect handler
│   ├── services/
│   │   ├── linkService.ts    Link CRUD logic
│   │   ├── analyticsService.ts  Click tracking and reporting
│   │   └── qrService.ts      QR code generation
│   ├── middleware/
│   │   ├── rateLimit.ts      Per-IP rate limiting
│   │   └── errorHandler.ts   Global error handler
│   ├── types/
│   │   └── index.ts          Shared TypeScript interfaces
│   └── utils/
│       ├── shortId.ts        nanoid wrapper
│       └── userAgent.ts      UA string parser
├── package.json
├── tsconfig.json
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

## License

MIT
