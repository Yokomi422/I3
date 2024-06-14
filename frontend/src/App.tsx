import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:5050");

const App: React.FC = () => {
  const [name, setName] = useState("");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [callingUser, setCallingUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<HTMLVideoElement | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const callFrom = useRef<string | null>(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("user-list", (users) => {
      setUsers(users);
    });

    socket.on("call-made", async (data) => {
      const { offer, from } = data;
      callFrom.current = from;
      setIsReceivingCall(true);
      if (pc.current) {
        await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
        socket.emit("make-answer", { answer, to: from });
      }
    });

    socket.on("answer-made", async (data) => {
      const { answer } = data;
      if (pc.current) {
        await pc.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    socket.on("ice-candidate", (data) => {
      const { candidate } = data;
      if (pc.current) {
        pc.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off("connect");
      socket.off("user-list");
      socket.off("call-made");
      socket.off("answer-made");
      socket.off("ice-candidate");
    };
  }, []);

  const register = () => {
    if (name) {
      socket.emit("register", name);
    }
  };

  const callUser = async (id: string) => {
    try {
      if (!pc.current) {
        pc.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        pc.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", {
              candidate: event.candidate,
              to: id,
            });
          }
        };

        pc.current.ontrack = (event) => {
          if (remoteStreamRef.current) {
            remoteStreamRef.current.srcObject = event.streams[0];
          }
        };

        localStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });

        localStreamRef.current.getTracks().forEach((track) => {
          if (pc.current) {
            pc.current.addTrack(track, localStreamRef.current!);
          }
        });

        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        socket.emit("call-user", { targetId: id, offer });
        setCallingUser(users.find((user) => user.id === id) || null);
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Error accessing media devices: " + error.message);
    }
  };

  const answerCall = async () => {
    try {
      if (callFrom.current && pc.current) {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });

        localStreamRef.current.getTracks().forEach((track) => {
          if (pc.current) {
            pc.current.addTrack(track, localStreamRef.current!);
          }
        });

        setIsReceivingCall(false);
        setCallingUser(
          users.find((user) => user.id === callFrom.current) || null
        );
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Error accessing media devices: " + error.message);
    }
  };

  const endCall = () => {
    if (pc.current) {
      pc.current.close();
      pc.current = null;
      setCallingUser(null);
      setIsReceivingCall(false);
    }
  };

  return (
    <div>
      <h1>WebRTC 1-on-1 Call</h1>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={register}>Register</button>

      {callingUser && (
        <div>
          <h2>Calling {callingUser.name}</h2>
          <button onClick={endCall}>End Call</button>
          <video ref={remoteStreamRef} autoPlay></video>
        </div>
      )}

      {isReceivingCall && (
        <div>
          <h2>Incoming call...</h2>
          <button onClick={answerCall}>Answer</button>
        </div>
      )}

      <h2>Users</h2>
      <ul>
        {users
          .filter((user) => user.id !== socket.id)
          .map((user) => (
            <li key={user.id}>
              {user.name}{" "}
              <button onClick={() => callUser(user.id)}>Call</button>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default App;
