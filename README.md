# Type Game

A production-ready speed typing game with Express-based authentication APIs and static frontend assets.

## Project Structure

- `src/` - server application code (config, middleware, services)
- `public/` - static frontend pages and built/minified assets
- `styles/` - source stylesheet files
- `tests/` - Jest + Supertest API tests

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment template:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` values (especially `JWT_SECRET`).

## Environment Variables

- `PORT` - server port (default: `3000`)
- `JWT_SECRET` - JWT signing secret (required in production)
- `CORS_ORIGIN` - allowed CORS origin(s), comma-separated or `*`
- `LOG_LEVEL` - pino log level (`info`, `debug`, etc.)

## Usage

- Start server:
  ```bash
  npm start
  ```
- Development mode:
  ```bash
  npm run dev
  ```

## Code Quality and Testing

- Lint: `npm run lint`
- Auto-fix lint issues: `npm run lint:fix`
- Format: `npm run format`
- Check format: `npm run format:check`
- Build minified assets: `npm run build`
- Test: `npm test`

## Deployment Notes

- Run behind HTTPS and set a strong `JWT_SECRET` in production.
- Build static assets before deploy:
  ```bash
  npm run build
  ```
- CI runs lint, build, and test on pull requests via `.github/workflows/ci.yml`.

## Logging and Security

- Structured production logging via `pino`/`pino-http`
- Secure headers via `helmet`
- Configurable CORS allowlist
- Input sanitization for auth fields
- Centralized error handling for consistent API responses

## License

MIT - see [LICENSE](./LICENSE).
