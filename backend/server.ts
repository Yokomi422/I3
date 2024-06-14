import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "./models";

const PORT = 5050;

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "*", // すべてのオリジンを許可（必要に応じて特定のオリジンに制限）
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.emit("hello", "from server");

  socket.on("message", (message) => {
    console.log(`Received message from client: ${message}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected. Reason: ${reason}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server start on port ${PORT}.`);
});
