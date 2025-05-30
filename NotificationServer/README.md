Plan on how the  notification server works:

    subgraph Frontend
        A[Flutter App (User A)] -->|HTTP POST| B(Main Backend Server)
        E[Flutter App (User B)] <-->|Socket.IO| D(Notification Server)
    end

    subgraph Backend
        B -->|Stores Message| DB[(Database)]
        B -->|POST /send-notification| D
        D -->|Emit "new_message"| E
    end


Work flow to implement the notification microservice:
Create a new Node.js project for notification server	✅
2️⃣	Add basic Socket.IO support and user tracking	✅
3️⃣	Add POST endpoint to emit messages to users	✅

The post in the frontend should not only emit messages via the socket but should also be sent to the db by the backend.

4️⃣	Test locally with multiple Flutter apps or Postman	🔄
5️⃣	Deploy notification server on Render/Railway	🔄
6️⃣	Set up a free Redis instance (Upstash etc.)	🔄
7️⃣	Add Redis publisher in backend	🔄
8️⃣	Add Redis subscriber in notification server	🔄
9️⃣	Test full flow with pub/sub	🔄

Including redis the flow would be:
Main backend → Redis publish → Notification server → Socket.IO emit → Flutter clients

graph TD
    A[Flutter App] -->|REST API| B[Main Backend]
    A -->|Socket.IO| D[Notification Server]
    B -->|Redis Publish| C[Redis]
    C -->|Redis Subscribe| D
    D -->|Emit to App| A


Updated flow of notifications:
[Flutter Admin App] --> [Backend API Server]
                             |
                             +--> DB (Docker)
                             |
                             +--> Redis PUB --> (channel: notifications)
                                        |
                     +------------------+------------------+
                     |                                     |
          [Notification Server]                [FCM Sender Service]
               (Socket.io)                            (firebase-admin)
                     |                                     |
               Real-time users                      Push to offline users
