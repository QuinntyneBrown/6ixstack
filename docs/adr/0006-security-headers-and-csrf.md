# 0006 Security headers, HSTS and CSRF

- Status: accepted (journey 00)

## Context

`platform/security-hardening` leaves the HSTS `max-age`, the `img-src` and `style-src` entries, the anti-forgery
key storage and the web app's hosting open.

## Decision

- HSTS: `max-age=31536000; includeSubDomains`, sent with HTTPS redirection everywhere except Development (local
  `dotnet run` and Playwright run plain HTTP on localhost).
- CSP: `default-src 'self'`, `script-src 'self'`, `connect-src 'self'`, `img-src 'self' data:`,
  `font-src 'self'`, `style-src 'self' 'unsafe-inline'`, `object-src 'none'`, `base-uri 'self'`,
  `form-action 'self'`, `frame-ancestors 'none'`. Angular injects component styles at runtime, so styles need
  `'unsafe-inline'` until a nonce is wired through `CSP_NONCE`. The map basemap's `img-src` host is added by
  journey 16.
- CSRF uses ASP.NET Core Antiforgery: when a session starts, the API stores its cookie token (HttpOnly,
  `SameSite=Strict`) and issues the request token in the script-readable `XSRF-TOKEN` cookie. Angular copies it
  into `X-XSRF-TOKEN`. `CsrfProtectionMiddleware` validates unsafe, cookie-authenticated requests after
  authorization; failures are 400 problem responses. This replaces the design's hand-rolled HMAC with the
  framework's equivalent; the Data Protection key ring location is set per environment.
- The headers apply to every API response. The host that will serve the built web app is not chosen yet; it must
  send the same headers (`SecurityHeadersMiddleware.ContentSecurityPolicy`).
