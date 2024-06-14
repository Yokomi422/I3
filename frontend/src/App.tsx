import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export type ServerToClientEvents = {
  hello: (message: string) => void;
};

/**
 * イベント受信時に使用する型定義
 */
export type ClientToServerEvents = {
  message: (message: string) => void;
};

// サーバーのURLを指定
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  "http://localhost:5050"
);

const App: React.FC = () => {
  const [message, setMessage] = useState("");
  const [receivedMessage, setReceivedMessage] = useState("");

  const sendMessage = () => {
    console.log("Sending message:", message);
    socket.emit("message", message);
    setMessage("");
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("hello", (message: string) => {
      console.log("Received message from server:", message);
      setReceivedMessage(message);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      socket.off("hello");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  useEffect(() => {
    // サーバーからのメッセージを受け取る
    socket.on("hello", (message: string) => {
      setReceivedMessage(message);
    });

    // クリーンアップ
    return () => {
      socket.off("hello");
    };
  }, []);

  return (
    <div>
      <h1>Socket.io React App</h1>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message"
      />
      <button onClick={sendMessage}>Send Message</button>
      <div>
        <h2>Received Message:</h2>
        <p>{receivedMessage}</p>
      </div>
    </div>
  );
};

export default App;
