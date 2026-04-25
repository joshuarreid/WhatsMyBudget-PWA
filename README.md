# wmb-pwa

## DigitalOcean App Platform (Production)

This is a Vite + React PWA.

### Build & Run Commands

- **Build command**: `npm run build`
- **Run command**: `npm run start`

The start script serves the built app on **0.0.0.0:8080** (DigitalOcean App Platform default), so you can use the default app URL without specifying a port.

### SPA Routing

A `public/_redirects` file is included so that deep links (e.g. `/login`) are rewritten to `/index.html`.

### Environment Variables

This app reads runtime configuration from Vite-provided environment variables.

Required:
- `VITE_API_BASE_URL`
  - Base URL for the backend API.
  - Example: `https://api.whatsmybudget.com`

Optional:
- `VITE_API_BASE_URL=http://localhost:8080` (default used only for local dev if not set)

#### Vite preview allowed hosts (DigitalOcean)

If you see an error like:

> Blocked request. This host ("…") is not allowed.

Set this env var in App Platform (or locally) so `vite preview` will accept the incoming Host header **without** hardcoding your app URL in the repo:

- `VITE_PREVIEW_ALLOWED_HOSTS`
  - Comma- or whitespace-separated hostnames.
  - Example: `whatsmybudgetpwa-q9rzb.ondigitalocean.app`

Notes:
- Variables must be prefixed with `VITE_` to be exposed to the frontend.
- Changing these requires a rebuild/redeploy on App Platform.
