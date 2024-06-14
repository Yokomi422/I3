import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "./models";

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  // サーバーのURLを指定
  "http://localhost:5050"
);

socket.on("connect", () => {
  console.log(socket.connected);
});

socket.on("hello", (message) => {
  console.log(message);
});

socket.emit("message", "hello world");
