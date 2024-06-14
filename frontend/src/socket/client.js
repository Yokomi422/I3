"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var socket_io_client_1 = require("socket.io-client");
var socket = (0, socket_io_client_1.io)(
// サーバーのURLを指定
"http://localhost:3000");
socket.on("connect", function () {
    console.log(socket.connected);
});
socket.on("hello", function (message) {
    console.log(message);
});
socket.emit("message", "hello world");
