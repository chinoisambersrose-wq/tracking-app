import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(auth: { token?: string; publicCode?: string }) {
  if (socket) socket.disconnect();
  socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000', {
    auth,
    autoConnect: true,
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
