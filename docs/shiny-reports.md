# Shiny reports integration

PSIRA treats Shiny reports as internal report tools instead of free-form external URLs.

## Flow

1. The backend exposes `availableShinyApps`.
2. `availableShinyApps` scans the configured `SHINY_APPS_DIR` and returns folders that contain an `app.R`.
3. The report administration form lets the user select one of those apps through `appName`.
4. The report URL is derived as `/shiny/<appName>`.
5. Report lists in dashboard and patient profile navigate to `/psira/reports/:id`.
6. The report view asks the backend for `getReportEmbed(id, patientId)`.
7. The backend only returns an active report if the current user has one of the report roles.
8. The backend signs a short-lived `embed_token` and returns a proxied iframe URL under `/shiny-embed/<token>/<app>/`.
9. The report view embeds the signed Shiny URL in an iframe.

Patient reports preserve context by passing `patient_id` to `/psira/reports/:id`, which is forwarded to the Shiny iframe URL.

## Docker requirement

The backend needs read-only access to the Shiny apps directory:

```yaml
environment:
  - SHINY_APPS_DIR=/opt/psira-shiny/shiny_apps
volumes:
  - ${SHINY_APPS_PATH}/shiny_apps:/opt/psira-shiny/shiny_apps:ro
```

`SHINY_APPS_PATH` is expected to point to the root of the `psira-shiny` repository.

The Shiny container is not exposed through a host port. Browser access goes through Caddy, which proxies signed `/shiny-embed/...` requests to the internal Docker service.

## Current access model

The frontend no longer sends users directly to `/shiny/...`; it routes through `/psira/reports/:id`.

Caddy blocks direct `/shiny/...` browser access. PSIRA loads Shiny through `/shiny-embed/<token>/<app>/`, and Caddy validates the token with the backend before proxying to the internal Shiny service.

When a user opens `/shiny/<app>` directly, the expected result is an HTTP `403` response with the message:

```text
Shiny apps must be opened from PSIRA.
```

That page is intentional. It is not a usable Shiny app route.

## Embed token

The backend signs a compact HMAC token with:

- `reportId`
- `userId`
- optional `patientId`
- `exp`
- random `nonce`

Docker passes the same secret to backend and Shiny:

```yaml
REPORT_EMBED_SECRET=${JWT_SECRET}
```

The default token TTL is 300 seconds and can be changed with:

```yaml
REPORT_EMBED_TOKEN_TTL=300
```

The shared Shiny helper lives in:

```text
psira-shiny/utility_functions/validateEmbedToken.R
```

Apps should parse `embed_token` from the URL and call `validateEmbedToken()` before loading sensitive data. The token is also present in the proxy path so Caddy can validate asset and session traffic under `/shiny-embed/...`.

The initial validation hook has been added to:

- `data-export`
- `data-export_with_filters`
- `patient-report`
- `usage-report`
- `user-report`

## Recommended hardening plan

1. Test each Shiny app through `/psira/reports/:id`.
2. Test direct `/shiny/<app>` access and confirm Caddy returns `403`.
3. Test token expiration by opening a report, waiting longer than `REPORT_EMBED_TOKEN_TTL`, and refreshing the iframe or page.

## Report usage tracking

Opening a report now creates a `report_session` row in the backend database through `startReportSession`.

The Angular report view:

- starts a session after `getReportEmbed` succeeds
- sends `heartbeatReportSession` every 30 seconds while the page remains open
- sends an extra heartbeat when the browser tab becomes hidden
- calls `endReportSession` when the report view is destroyed or the browser page unloads

Each session stores:

- `reportId`
- `userId`
- optional `patientId`
- `startedAt`
- `lastSeenAt`
- optional `endedAt`
- `durationSeconds`
- `active`

If the browser is closed before the final mutation completes, `lastSeenAt` from the latest heartbeat still gives an approximate duration. The table is intentionally low-level for now; a future admin view can aggregate entries by user, report, patient, date, or total duration.

## Report usage summary app

The Shiny app `report-usage-summary` summarizes rows from `report_session`.

It shows:

- total report sessions
- unique users
- unique patients with report context
- total viewing time
- sessions by report
- minutes by report
- a session-level table

The app calls the backend GraphQL query `reportSessions`, which is protected with `MANAGE_REPORTS`. Register this app as a normal report with:

```text
appName: report-usage-summary
url: /shiny/report-usage-summary
```

Recommended access: admin/report-management roles only, because the data includes user IDs and optional patient IDs.

This is stronger than relying on hidden routes, referer checks, or UI-only navigation.
