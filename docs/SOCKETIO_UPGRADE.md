# Socket.IO upgrade runbook

This document explains how to move the Universal Presenter Remote stack to the
latest Socket.IO (v4) **without breaking desktop clients that are already
installed in the field**.

> Status: **planning only.** The desktop app currently pins
> `socket.io-client@2.5.0` and no code in this release changes the Socket.IO
> version. Follow this runbook when you are ready to upgrade.

## Background

| Component | Where | Current Socket.IO |
| --- | --- | --- |
| Desktop app | this repo (`src/main/socket.ts`) | `socket.io-client` **v2** (Engine.IO 3) |
| Server | `Universal-Presenter-Remote-Server` (`src/bin/www`) | `socket.io` **^2.4.1** |

The desktop connects to `https://universalpresenterremote.com`, listens on a
channel named after the 6‑digit token, and receives signed messages
(`{ action, holdfor, timestamp, signature }`). The server broadcasts them with
`io.emit(token, command)` from `src/routes/v1/rest.js` (`emitCommand`).

The hard constraint: **users on old app builds cannot be force-upgraded.** Any
server change must keep serving those `socket.io-client@2` clients.

## The key lever: `allowEIO3`

Socket.IO v3 dropped the Engine.IO 3 wire protocol; v3.1+/v4 can re-enable it
with the server option **`allowEIO3: true`**. A v4 server with that flag serves
**both** legacy v2 (EIO3) clients and modern v4 (EIO4) clients at the same time,
on the same port and namespace. The application-level contract used here
(`io(url)` → `socket.on(token, …)` on the client, `io.emit(token, cmd)` on the
server) is identical across versions — only the transport handshake differs, and
`allowEIO3` bridges it.

## Phase 1 — Upgrade the server (app stays on v2)

In the server repo, bump `socket.io` to the latest v4 and update the
instantiation in `src/bin/www`:

```js
// before (v2):
// const io = require('socket.io')(server);

// after (v4):
const { Server } = require('socket.io')
const io = new Server(server, {
  allowEIO3: true,                       // accept legacy socket.io-client v2 (EIO3) clients
  transports: ['polling', 'websocket'],  // keep polling fallback while v2 clients exist
  cors: {                                // v3+ requires explicit CORS for browser remotes
    origin: ['https://universalpresenterremote.com'],
    methods: ['GET', 'POST']
  }
})
```

Deploy, then **verify with an old desktop build** (one running
`socket.io-client@2`) that it still connects and advances slides. At this point
the field is unchanged from the user's perspective, but the server is modern.

## Phase 2 — Upgrade the app (new release)

In a future desktop release, change `package.json`:

```diff
- "socket.io-client": "2.5.0"
+ "socket.io-client": "^4.8.3"
```

No change to `src/main/socket.ts` is required for the usage in this app
(`io(SERVER_URL)`, `socket.on(token, …)`, `socket.close()` all exist in v4).
New installs connect over EIO4; existing v2 installs keep using EIO3 against the
same `allowEIO3` server.

## Phase 3 — Retire the compatibility shim

Track how many EIO3 (v2) clients remain. Two signals are available:

- The app already sends `upr_version` and `upr_platform` headers on
  `GET /JoinSession` — log/aggregate these server-side.
- Engine.IO exposes the negotiated protocol version per connection.

Once legacy clients fall below an acceptable threshold, drop the shim:

```js
const io = new Server(server, {
  // allowEIO3 removed
  transports: ['websocket'],            // optional: tighten now that v2 is gone
  cors: { origin: ['https://universalpresenterremote.com'], methods: ['GET', 'POST'] }
})
```

This reclaims the v4 performance/security defaults.

## Compatibility checklist (verified against the server code)

- **Message signing is version-independent.** `emitCommand` signs
  `JSON.stringify({ action, holdfor, timestamp })` with RSA‑SHA256 regardless of
  Socket.IO version, and the desktop verifies it against the pinned public key
  (`src/main/verify.ts`). **Do not reorder those fields or change `JSON.stringify`
  behaviour** during the upgrade or every signature check will fail.
- **CORS** is mandatory from v3 onward for browser-based remotes/test pages. The
  desktop client runs in the Electron main process (a Node context) and is not
  subject to browser CORS, but the web `control`/`testing` pages are.
- **Transports:** v3+ defaults to websocket-only. Keep `polling` in the list
  while any v2 clients remain.
- **Namespaces / rooms:** unchanged — the default namespace plus dynamic
  per-token event names work across all versions.
