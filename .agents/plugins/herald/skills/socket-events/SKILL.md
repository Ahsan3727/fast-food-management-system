---
name: socket-events
description: >-
  Use this skill when the user asks to set up, debug, or review real-time
  Socket.IO events in the fast-food management system. Covers the socket gateway,
  room management, event contracts, and client-side socket hooks.
---

# Socket Events Skill

This skill guides you through implementing and debugging real-time Socket.IO events in the fast-food management system.

## Socket Architecture

- **Transport**: `websocket` only — no polling fallback (C5).
- **Auth**: JWT passed in the `auth` option on the handshake; validated server-side before any room joins.
- **Rooms**: `restaurant:{id}`, `riders:available`, `order:{orderId}`, `user:{userId}`.
- **Room joins**: Always authorized server-side — the server joins rooms from the verified JWT, never from a client request.

## Event Contract (from `packages/shared-types/socket-events.ts`)

| Event | Direction | Room | Payload |
|---|---|---|---|
| `order:new` | Server → Admin | `restaurant:{id}` | `{ orderId, summary }` |
| `order:status` | Server → Customer | `order:{orderId}` | `{ orderId, status }` |
| `delivery:request` | Server → Rider | `riders:available` | `{ orderId, pickupLocation, dropLocation }` |
| `delivery:request:cancelled` | Server → Rider | `riders:available` | `{ orderId }` |
| `rider:location` | Rider → Server | (socket emit) | `{ orderId, lat, lng }` |
| `rider:location:update` | Server → Customer | `order:{orderId}` | `{ lat, lng }` |

## Steps

### 1. Understand the Failing Event

- Identify which event is missing or misbehaving.
- Check: is the client connected? Is it in the correct room? Is the server emitting?

### 2. Inspect the Gateway

- Open `apps/api/src/realtime/gateway.ts`.
- Confirm the JWT is validated on the handshake.
- Confirm room joins happen after JWT verification — not from client input.

### 3. Debug Client-Side

```ts
// lib/socket.ts — correct setup
const socket = io(VITE_SOCKET_URL, {
  transports: ['websocket'],
  auth: { token: accessToken },
});
socket.on('connect_error', (err) => console.error(err.message));
```

After every reconnect or app resume, refetch state through REST — do not rely solely on socket state.

### 4. Debug Server-Side

- Check the NestJS gateway for the event handler.
- Confirm the correct room name is used when emitting.
- Check Redis adapter is connected (for multi-instance deployments).

### 5. Verify

- Open browser DevTools → Network → WS to inspect frames.
- Confirm events arrive in the correct room only (no leaking to other customers).
