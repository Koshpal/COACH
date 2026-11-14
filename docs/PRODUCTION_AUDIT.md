# Coach Portal Production Readiness Audit

Audit target: `Koshpal/COACH` (default branch `main`) and the Coach-facing API in `Koshpal/BACKEND`.

This is a source-code review, not a production certification. No authenticated browser session, live database, deployed environment, or local build/test runner was available during this pass. Findings below distinguish code changes made on audit branches from items that still require verification.

## Changes made on audit branches

### Coach portal — `fix/coach-portal-production-hardening`

- Session Runner now disables note editing, action-plan changes, debt entry, and session closure when the consent state returned by the API is inactive.
- Unsaved coaching-note recovery drafts now use `sessionStorage` instead of persistent `localStorage`, reducing retention on shared devices and after browser restarts.
- API rate-limit retries are limited to GET/HEAD/OPTIONS; mutating requests are not replayed automatically after HTTP 429.
- Login, refresh, and logout endpoints are excluded from the generic 401 refresh loop.
- Sessions month filter is populated from actual session dates instead of hardcoded 2023 values.
- External meeting links opened from the Sessions page now use `noopener,noreferrer`.

### Backend — `fix/coach-web-auth-token-exposure`

- For requests with an Origin on `koshpal.com` or a subdomain, login and refresh responses no longer duplicate access/refresh tokens in JavaScript-readable JSON. Browser portals continue to receive httpOnly cookies.
- Native clients without a browser Origin retain the token response for compatibility.
- Removed the committed `cookies.txt` artifact from this branch and added cookie-artifact ignore patterns.

## Remaining production blockers / required follow-up

### Critical — credential hygiene

- The backend repository contained a tracked file named `cookies.txt`. It was removed from the remediation branch, but deleting a file does not remove it from prior Git history. Treat any credentials or session material that may have been present as compromised: revoke active sessions/tokens, rotate any affected credentials, and consider history rewriting only after coordinating with all repository collaborators. The file contents were not inspected.

### High — consent state freshness

- The Session Runner receives consent as part of its initial state. If an employee withdraws consent while a coach already has the runner open, the UI can remain visually editable until a subsequent API write is rejected. The backend's `assertWritable` path rechecks active consent before accepting note writes, so this is not a substitute for server enforcement; implement a lightweight consent/session-state refresh and lock the UI immediately when consent becomes inactive.
- Verify every write path (notes, action items, debts, closure, escalation, homework and tools) performs server-side assignment and consent checks where the data is consent-dependent.

### High — legacy Sessions workflow

- `src/pages/Sessions/Sessions.tsx` still uses the older `coachService` API and legacy end-session modals while the Dashboard and Session Runner use the newer `/coach/coaching` workflow.
- Its end-session handler suppresses completion and note-save errors, then reloads the list. This can make a failed operation appear successful. Migrate the page to the standardized prepare/runner/closure workflow or remove the legacy completion actions, and surface all mutation failures.
- `src/services/adapters.ts` contains presentation fallbacks and fabricated default topics/values. Confirm that no fallback/mock content can be presented as live employee or session data in production.

### High — browser authentication / CSRF verification

- The backend sets cookies on the parent `.koshpal.com` domain for portal SSO. This is intentional for cross-subdomain login, but sibling subdomains are same-site. Verify strict CORS allowlisting and Origin validation on state-changing endpoints; `SameSite=Lax` alone is not a complete CSRF defence for sibling subdomains.
- Verify cookie clearing uses the same Secure, SameSite, Path and Domain attributes as cookie creation in every production deployment.
- Verify browser login and refresh responses omit tokens for all real portal origins, including preview/staging domains if those are trusted.

### Medium — production configuration and testing

- `src/services/api.ts` falls back to `http://localhost:3000/api/v1` when `VITE_API_URL` is absent. Make the production build fail or use an explicitly configured production API URL; do not allow a production bundle to silently target localhost.
- The Coach frontend package currently exposes only `dev`, `build`, and `preview` scripts. Add automated lint, unit, component, and end-to-end test commands and make them required CI checks.
- No local `npm ci`, TypeScript build, browser test, or live API test was executed in this review. Run the build and full test suite before merging either branch.
- Verify Vercel production environment variables, SPA fallback routing, HTTPS, CSP/security headers, source-map policy, and error monitoring.

### Medium — UI and workflow checks still required

- Verify the calendar's date grouping, positioning, and labels use the configured `Asia/Kolkata` timezone rather than the viewer's machine timezone.
- Test all pages at mobile, tablet, and desktop widths, including keyboard navigation, focus trapping, accessible labels, contrast, and reduced-motion preferences.
- Exercise empty, loading, partial-data, 401, 403, 404, 409, 422, 429, 500, timeout, and offline states.
- Test concurrent edits from two tabs/devices, note conflict resolution, autosave during navigation, browser refresh, and session completion with unsaved changes.
- Verify that coach notes marked private are never returned to employees or HR; HR reporting must remain aggregate-only.
- Verify object-level authorization for every employee/session/action-item/debt/homework/tool/escalation identifier, including reassignment and revoked assignment scenarios.
- Verify UTC persistence and explicit `Asia/Kolkata` display across daylight-saving and browser-timezone differences.

## Release gate

Do not deploy these changes directly to production until both branches pass clean installs, builds, automated tests, API integration tests, and a staging smoke test with real Coach/Employee/HR/Admin role accounts. Merge only after the credential-rotation and consent-refresh items are addressed.
