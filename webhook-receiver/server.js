const express = require('express')

const app = express()
app.use(express.json({ limit: '2mb' }))

// Agent -> Admin API base (service names resolve inside docker compose network)
const ADMIN_BY_AGENT = {
  issuer:   'http://issuer:8051',
  holder:   'http://holder:8061',
  verifier: 'http://verifier:8071',
}
const APIKEY = process.env.ADMIN_API_KEY || '' // leave empty when using --admin-insecure-mode

// simple in-memory store: { "<agent>/<topic>": [events...] }
const store = new Map()
const MAX_PER_TOPIC = 200

// subscribers: { agent, walletId, res }
const subscribers = new Set()

function classifyInboxEvent(agent, topic, body) {
  const state = body && body.state

  if (topic === 'present_proof_v2_0') {
    if (agent === 'holder' && state === 'request-received') {
      return 'proof_request_received'
    }
    if (agent === 'verifier' && state === 'done') {
      return 'vp_received'
    }
  }

  if (topic === 'issue_credential_v2_0') {
    if (agent === 'holder' && state === 'done') {
      return 'vc_received'
    }
  }

  return null
}

function pushEvent(key, obj) {
  const arr = store.get(key) || []
  arr.push({ ts: new Date().toISOString(), ...obj })
  if (arr.length > MAX_PER_TOPIC) arr.shift()
  store.set(key, arr)
}

function broadcastInbox(agent, ev) {
  for (const sub of subscribers) {
    if (sub.agent !== agent) continue

    // If subscriber asked for a specific wallet and event has wallet_id, enforce match
    if (sub.walletId) {
      if (!ev.wallet_id) {
        // event has no wallet_id -> skip for wallet-scoped subscribers
        continue
      }
      if (ev.wallet_id !== sub.walletId) continue
    }

    sub.res.write(`data: ${JSON.stringify(ev)}\n\n`)
  }
}

async function withTimeout(promiseFactory, ms) {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), ms)
  try {
    return await promiseFactory(ac.signal)
  } finally {
    clearTimeout(t)
  }
}

async function resolveCounterparty(agent, connectionId) {
  const base = ADMIN_BY_AGENT[agent]
  if (!base || !connectionId) return null

  const headers = {}
  if (APIKEY) headers['x-api-key'] = APIKEY

  try {
    const res = await withTimeout(
      signal => fetch(`${base}/connections/${connectionId}`, { headers, signal }),
      1000
    )
    if (!res || !res.ok) return null
    const data = await res.json()
    return {
      their_label: data.their_label,
      their_did: data.their_did,
      my_did: data.my_did,
      state: data.state,
      invitation_key: data.invitation_key,
      connection_id: data.connection_id,
    }
  } catch {
    return null
  }
}


// list everything
app.get('/events', (_req, res) => {
  const out = {}
  for (const [k, v] of store.entries()) out[k] = v
  res.json(out)
})

// filter by agent/topic, e.g. /events/issuer/basicmessages
// receive webhooks: /:agent/topic/:topic
app.post('/:agent/topic/:topic', async (req, res) => {
  const { agent, topic } = req.params
  const body = req.body || {}

  // NEW: read wallet id from header (multitenant)
  const headerWalletId =
    req.get('x-wallet-id') || req.get('X-Wallet-Id') || null

  const wallet_id =
    headerWalletId ||
    body.wallet_id ||
    body.walletId ||
    (body.metadata && (body.metadata.wallet_id || body.metadata['x-wallet-id'])) ||
    null

  const counterparty = body.connection_id
    ? await resolveCounterparty(agent, body.connection_id)
    : null

  // raw stream (include wallet_id for debugging)
  pushEvent(`${agent}/${topic}`, { agent, topic, wallet_id, counterparty, body })

  const kind = classifyInboxEvent(agent, topic, body)
  if (kind) {
    const ev = {
      ts: new Date().toISOString(),
      agent,
      topic,
      type: kind,
      wallet_id,      // <- now set
      counterparty,
      body,
    }

    pushEvent(`${agent}/inbox`, ev)
    broadcastInbox(agent, ev)
  }

  res.sendStatus(200)
})


// GET /events/:agent/inbox?type=proof_request_received|vc_received|vp_received
app.get('/events/:agent/inbox', (req, res) => {
  const { agent } = req.params
  const type = (req.query.type || '').toString().trim().toLowerCase()
  const key = `${agent}/inbox`

  let events = store.get(key) || []
  if (type) {
    events = events.filter(
      ev => (ev.type || '').toLowerCase() === type
    )
  }

  res.json(events)
})

app.get('/', (_req, res) =>
  res.send(
    'Webhook receiver up. POST to /:agent/topic/:topic, GET /events, GET /events/:agent/:topic, GET /events/:agent/inbox, GET /stream/:agent[?wallet_id=...]'
  )
)

// SSE stream: /stream/:agent[?wallet_id=...]
app.get('/stream/:agent', (req, res) => {
  const { agent } = req.params
  const walletId = (req.query.wallet_id || '').toString().trim() || null

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const sub = { agent, walletId, res }
  subscribers.add(sub)

  // optional: send current backlog for this agent (and wallet, if set)
  const key = `${agent}/inbox`
  const existing = store.get(key) || []
  for (const ev of existing) {
    if (walletId) {
      if (!ev.wallet_id) continue
      if (ev.wallet_id !== walletId) continue
    }
    res.write(`data: ${JSON.stringify(ev)}\n\n`)
  }

  req.on('close', () => {
    subscribers.delete(sub)
  })
})

app.listen(9000, () => console.log('Webhook receiver on http://0.0.0.0:9000'))


//From a client:

// // Holder listening for proof requests:
// const es = new EventSource('http://localhost:9000/stream/holder');
// es.onmessage = (e) => {
//   const ev = JSON.parse(e.data);
//   // ev.type === 'proof_request_received' / 'vc_received'
//   // update UI, badge, etc.
// };
//stam@Sz-IdeaPad-5-Pro-16ACH6:~/consentis-pub-priv-k$ curl -N "http://localhost:9000/stream/holder?wallet_id=361f90ef-d808-4bd7-860e-d6bc06d04d96"
