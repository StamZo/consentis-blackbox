# Consentis Blackbox Gateway API Docs (Swagger UI)

This folder contains a static Swagger UI for the Consentis "blackbox" REST endpoints exposed by the demo gateway.

- `openapi.yaml`: OpenAPI 3.0 spec for the gateway endpoints.
- `index.html`: Swagger UI that loads `openapi.yaml`.

## Run Locally

1. Start the gateway on port `8000` and allow the docs origin via CORS.
2. Serve this folder:
   - `cd fabric-samples/asset-transfer-basic/application-gateway-typescript/docs`
   - `python3 -m http.server 8089`
3. Open:
   - `http://localhost:8089/#/`

## Run On A VM / Access Remotely

When you browse Swagger UI from another machine, `localhost` in the **Servers** dropdown refers to your browser machine (not the VM).

- Example: docs served from VM at `http://10.1.6.251:8089/#/`
- Select server: `http://10.1.6.251:8000`
- Ensure the gateway allows the exact docs origin in `ALLOWED_ORIGINS`, e.g.:
  - `ALLOWED_ORIGINS=http://localhost:8089,http://127.0.0.1:8089,http://10.1.6.251:8089`

If you see "Failed to fetch" in Swagger UI, it is almost always a CORS origin mismatch or a wrong server base URL selection.

## Peer Selection

Most `/agent/*` endpoints target an internal peer via the `x-selected-peer` header:

- `issuer` (Org1, single-tenant)
- `holder` (Org2, multitenant)
- `verifier` (Org3, multitenant)
- aliases: `1|2|3`

## Tenant JWTs (holder/verifier)

Holder/verifier calls require an ACA-Py tenant JWT.

- Create a tenant + mint a JWT via `POST /agent/tenants/create` with `x-selected-peer: holder` or `verifier`.
- In Swagger UI, paste the JWT into the per-request `x-tenant-jwt` field (raw JWT or `Bearer <jwt>`), or use the top-right **Authorize** button.

Note: `x-tenant-jwt` is a docs-only convenience header. The docs page sends it as `Authorization: Bearer <jwt>` and does not forward `x-tenant-jwt` to the API.

## Notes / Gotchas

- JSON request bodies must be valid JSON (no `//` comments).

## PM2 (Optional)

From `fabric-samples/asset-transfer-basic/application-gateway-typescript`:

- Start gateway (loads `.env`):
  - `pm2 start dist/app.js --name consentis-app --node-args="-r dotenv/config"`
- Restart gateway (to pick up `.env` changes):
  - `pm2 restart consentis-app`
- Serve docs:
  - `pm2 serve docs 8089 --name consentis-docs --spa`
