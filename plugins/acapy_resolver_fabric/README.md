# Plugins

This folder holds local ACA-Py plugins that are mounted into the agent
containers and enabled via `--plugin`.

## acapy_resolver_fabric
Custom DID resolver for `did:fabric:*` identifiers.

Purpose:
- Calls an external resolver service (Node/Express) to fetch a DID Document.
- Normalizes the DID Document into the shape ACA-Py expects for DIDComm.
- Optionally carries BBS/BLS keys when present in the upstream response.

Location:
- `plugins/acapy_resolver_fabric/`

Key files:
- `plugins/acapy_resolver_fabric/pyproject.toml`: package metadata and deps.
- `plugins/acapy_resolver_fabric/acapy_resolver_fabric/__init__.py`:
  registers the `fabric` DID method and resolver with ACA-Py.
- `plugins/acapy_resolver_fabric/acapy_resolver_fabric/fabric_resolver.py`:
  resolver implementation and DIDDoc normalization.
- `plugins/acapy_resolver_fabric/acapy_resolver_fabric/fabric_resolver copy.py`:
  archived copy (not used by ACA-Py).

Runtime configuration:
- `FABRIC_RESOLVER_URL` (required): base URL for the resolver service.
  Example: `http://host.docker.internal:8000/fabric-did`

Docker usage (from `docker-compose.yml`):
- Mounts: `./plugins/acapy_resolver_fabric:/plugins/acapy_resolver_fabric:ro`
- Env: `PYTHONPATH=/plugins/acapy_resolver_fabric`
- Flag: `--plugin acapy_resolver_fabric`
