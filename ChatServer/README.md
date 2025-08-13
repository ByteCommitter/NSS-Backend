
# Chat Microservice Integration

This repository showcases the integration of a real-time chat microservice into a Node.js backend, built with a focus on modularity, authentication, and scalability.

## 🔧 Features

- **Microservice Architecture**: Seamlessly integrated the chat microservice with the main authentication server while maintaining complete service isolation.
- **JWT-Based Auth Handoff**: Used secure JWT tokens to authorize and verify user sessions across services.
- **Redis TTL**: Leveraged Redis to store chat messages temporarily with automatic expiration to manage memory effectively.
- **Session Expiry and Cleanup**: Implemented auto-expiry of chats and session TTL logic to ensure efficient cleanup of stale data.
- **Real-Time Messaging**: Enabled WebSocket-based real-time messaging between authenticated users.
- **Chat Summary Pipeline (Planned)**: Set up the architectural foundation for future integration with an LLM-based background task queue for chat summarization.

## 📦 Technologies

- **Node.js** / **Express.js**
- **WebSockets**
- **Redis** (as cache and temporary chat storage)
- **JWT** (for authentication and identity propagation)
- **Firebase Cloud Messaging** (for push notifications)
- **MongoDB** (for long-term chat storage - upcoming)
- **BullMQ** (planned for queue-based background summarization tasks)

## 🧠 Design Highlights

- Token-based stateless communication between services ensures secure and scalable chat interactions.
- Redis key TTLs act as ephemeral session state, making the system memory-efficient.
- Foundation laid for future LLM-based chat summarization using Gemini + message queues.

---

> Built for real-world usage and scalability, this project demonstrates service decoupling, real-time interaction, and session lifecycle management in distributed systems.
