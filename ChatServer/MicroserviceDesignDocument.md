## Chat Microservice Design Document

### 1. Overview

A Redis-only, stateless ChatService secured via JWTs issued by the MainServer. Supports both 1:1 and group chats, sliding inactivity TTL, secure WebSocket connections, and token refresh.

---

### 2. Authentication & Authorization

**2.1 App JWT** (Issued at login)

* Contains: `userId`, `role`, broad app permissions
* Long expiry (e.g., 30 days)

**2.2 Chat JWT** (Issued on session creation/join)

* Contains:

  * `userId`
  * Optional `anonymousId` (for privacy)
  * `chatPermissions`: `["send","read"]`
  * `exp`: session lifetime (e.g., 7 days)
* Signed with shared secret known to both services
* Stateless: ChatService only does `jwt.verify(token, SECRET)`

**2.3 Minimal-Claims Approach**

* **JWT carries identity**, not full room membership
* On WebSocket handshake, ChatService:

  1. Verifies JWT signature & `exp`
  2. Extracts `userId`
  3. Reads Redis metadata for `sessionId`
  4. Checks `userId` ∈ participants list

---

### 3. Redis Data Model

For each chat session `chat_{id}`:

1. **`chat_{id}:metadata`** (HASH)

   * `participants`: JSON array of user IDs
   * `createdAt`: timestamp
   * `status`: `"active"`

2. **`chat_{id}:messages`** (LIST)

   * JSON-encoded messages
   * Only last *N* messages (list-trimmed)

3. **`user_{id}:sessions`** (SET)

   * Tracks all session IDs a user can access

---

### 4. Sliding-Window TTL

Messages keep the session alive; idle sessions auto-expire.

```js
async function onNewMessage(sessionId, msg) {
  const metaKey = `${sessionId}:metadata`;
  const msgsKey = `${sessionId}:messages`;
  const TTL = 7*24*3600; // 7 days

  await redis.rpush(msgsKey, JSON.stringify(msg));
  await redis.ltrim(msgsKey, -N, -1);

  await redis.expire(metaKey, TTL);
  await redis.expire(msgsKey, TTL);
}
```

* **First message** sets TTL
* **Each message** resets TTL to 7 days
* If no message in 7 days → Redis auto-deletes keys

---

### 5. Message Flow & Real-Time

1. **Client**: opens WebSocket to `wss://chatservice/session/{sessionId}` with header `Authorization: Bearer <Chat-JWT>`
2. **ChatService** handshake:

   * Verifies token
   * Extracts `userId`
   * Looks up metadata: `redis.hget(sessionId:metadata, "participants")`
   * Confirms membership
3. **On message**:

   * `onNewMessage()` pushes to Redis list + TTL reset
   * `redis.publish(sessionId, JSON.stringify(msg))`
   * ChatService broadcasts to all connected sockets for that session
4. **Offline**: if user disconnected, ChatService can trigger FCM push

---

### 6. Token Refresh

**Endpoint**: `POST /api/chat/refresh`

* Headers: `Authorization: Bearer <App-JWT>`
* Body: `{ sessionId, chatToken }`

**MainServer**:

1. Verifies App-JWT
2. Verifies Chat-JWT signature (ignore `exp`) → extracts `userId`
3. Checks `redis.exists(sessionId:metadata)`
4. Checks `userId` ∈ participants
5. Issues new Chat-JWT with fresh `exp`

**Client**:

* Parses old JWT `exp`
* Fires refresh when `now + buffer >= exp`
* Replaces stored token seamlessly

---

### 7. User’s Session Directory

Frontend calls `GET /api/chat/sessions`:

* **MainServer** reads from `user_{userId}:sessions` (Redis SET)
* Returns list of session IDs, metadata (e.g., names, lastMessageAt)
* Client uses these IDs to display chat list

---

### 8. Group Chats

* Create session:

  ```js
  const sessionId = "chat_" + uuidv4();
  const participants = [...];
  redis.hset(`${sessionId}:metadata`, {
    participants: JSON.stringify(participants),
    createdAt: Date.now(),
    status: "active"
  });
  redis.expire(`${sessionId}:metadata`, TTL);
  redis.sadd(`user_${userId}:sessions`, sessionId);
  participants.forEach(u => redis.sadd(`user_${u}:sessions`, sessionId));
  ```
* JWT doesn’t need full participant list
* Access check always hits Redis once per handshake

---

### 9. Security & Performance

* **One Redis lookup** per WebSocket handshake → \~1ms
* **No per-message auth calls** once socket open
* **Sliding TTL** auto-cleans idle data
* **SETs** track user ↔ session mappings
* **LIST-trim** keeps memory bounded

---

### 10. Summary

This design keeps ChatService stateless (aside from Redis), secures each connection via JWT+Redis check, auto-expires idle sessions, supports DM & group chats, and allows clean token refresh—all with **Redis only**.
