import type { ClientSocket } from "../client.ts";
import type { HostRemoteSocket } from "../host.ts";

export interface EmitEvents {
  signAtarIDR: (values: number[]) => void;
  signAtarI: (dial: number, value: number) => void;
}

export interface ListenEvents {
  signAtarI: (dial: number, value: number) => void;
}

export interface ServerSideEvents {}

export interface SocketData {}

export default function signAtarHandle(
  socket: ClientSocket,
  host: HostRemoteSocket,
) {
  host.emit("signAtarIDR", (idr: number[]) => {
    if (!Array.isArray(idr)) return;
    if (!idr.every((v) => typeof v === "number")) return;

    socket.emit("signAtarIDR", idr);
  });

  socket.on("signAtarI", (dial: number, value: number) => {
    if (typeof dial !== "number" || typeof value !== "number") return;

    // Let the client handle actually checking that the dial and value are in range.
    host.emit("signAtarI", dial, value, socket.id);
    socket.to(`${socket.data.hostId}-signatar`).emit("signAtarI", dial, value);
  });
}
