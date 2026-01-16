# Webhook Receiver

Small Express server that receives ACA-Py webhooks, keeps a short in-memory history, and provides live updates via SSE.

## What it does
- Accepts webhooks at `/:agent/topic/:topic` (ACA-Py appends `/topic/<topic>` to the configured base webhook URL).
- Stores raw events under `<agent>/<topic>` in memory (max 200 per topic).
- Creates a simplified "inbox" stream for selected topics/states.
- Streams live events to clients over Server-Sent Events (SSE).

## Quick start
Requires Node.js 18+ (uses global `fetch`) and `express`.

```bash
cd /home/stam/consentis_hlf/webhook-receiver
npm i express
node server.js
```

Server listens on `http://0.0.0.0:9000`.

## Configuration
- `ADMIN_API_KEY`: optional API key sent to ACA-Py admin endpoints (header `x-api-key`).
- `ADMIN_BY_AGENT` (in `server.js`): maps `issuer|holder|verifier` to ACA-Py admin URLs. These default to Docker Compose service names:
  - `issuer:8051`, `holder:8061`, `verifier:8071`

If you run outside Docker, update `ADMIN_BY_AGENT` to real hostnames.

## Endpoints
- `POST /:agent/topic/:topic`
  - Main webhook receiver.
  - Stores raw event under `<agent>/<topic>`.
  - Adds `wallet_id` if present (header `x-wallet-id` or payload fields).
  - Resolves connection counterparty via ACA-Py admin API when `connection_id` exists.
- `GET /events`
  - Returns all stored events, grouped by `<agent>/<topic>`.
- `GET /events/:agent/inbox?type=proof_request_received|vc_received|vp_received`
  - Returns the simplified inbox events for one agent.
- `GET /stream/:agent[?wallet_id=...]`
  - SSE live stream; optional `wallet_id` filters events per tenant.

Note: `GET /events/:agent/:topic` is not implemented (comment only).

## Inbox classification
These events are copied into `<agent>/inbox`:
- `present_proof_v2_0`:
  - `holder` + `state=request-received` -> `proof_request_received`
  - `verifier` + `state=done` -> `vp_received`
- `issue_credential_v2_0`:
  - `holder` + `state=done` -> `vc_received`

## Tenant (wallet) filtering
For multitenant ACA-Py, the receiver extracts `wallet_id` from:
- `x-wallet-id` header
- `wallet_id` / `walletId` in the payload
- `metadata.wallet_id` or `metadata["x-wallet-id"]`

Use it to filter the SSE stream:

```
http://localhost:9000/stream/holder?wallet_id=<wallet_id>
```

## Example: live feed in a browser
```html
<!doctype html>
<html>
  <body>
    <pre id="log"></pre>
    <script>
      const log = document.getElementById('log');
      const es = new EventSource('http://localhost:9000/stream/holder');
      es.onmessage = (e) => {
        const ev = JSON.parse(e.data);
        log.textContent += JSON.stringify(ev, null, 2) + "\n\n";
      };
    </script>
  </body>
</html>
```

## Notes
- Storage is in-memory; all events are lost on restart.
- Each `<agent>/<topic>` keeps up to 200 entries (oldest dropped).
