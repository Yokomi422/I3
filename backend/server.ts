import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

const PORT = 5050;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

interface User {
  id: string;
  name: string;
}

let users: User[] = [];

io.on("connection", (socket: Socket) => {
  console.log("New client connected:", socket.id);

  socket.on("register", (name: string) => {
    users.push({ id: socket.id, name });
    io.emit("user-list", users);
  });

  socket.on("call-user", (data) => {
    const { targetId, offer } = data;
    io.to(targetId).emit("call-made", { offer, from: socket.id });
  });

  socket.on("make-answer", (data) => {
    const { answer, to } = data;
    io.to(to).emit("answer-made", { answer, from: socket.id });
  });

  socket.on("ice-candidate", (data) => {
    const { candidate, to } = data;
    io.to(to).emit("ice-candidate", { candidate, from: socket.id });
  });

  socket.on("disconnect", () => {
    users = users.filter((user) => user.id !== socket.id);
    io.emit("user-list", users);
    console.log(`Client disconnected. ID: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server start on port ${PORT}.`);
});
