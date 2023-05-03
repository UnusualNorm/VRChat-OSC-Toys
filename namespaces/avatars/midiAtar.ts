import type { Socket } from "socket_io";
import type { SocketData as ClientSocketData } from "../client.ts";
import type {
  ServerToSocketEvents as HostServerToSocketEvents,
  SocketData as HostSocketData,
} from "../host.ts";
import { RemoteSocket } from "https://deno.land/x/socket_io@0.2.0/packages/socket.io/lib/broadcast-operator.ts";

export interface ServerToSocketEvents {
  midiAtarKey: (key: number, pressed: boolean, client: string) => void;
}

export interface SocketToServerEvents {
  midiAtarKey: (
    key: number,
    pressed: boolean,
    // cb(success: true): void,
    // cb(success: false, reason: "ownership" | "input"): void,
    // TODO: Fix this type
    cb?: (
      success: boolean,
      reason?: "ownership" | "input" | "duplicate",
    ) => void,
  ) => void;
}

export interface InterServerEvents {}

export interface SocketData extends ClientSocketData {}

const midiAtarHosts = new Map<string, Map<number, string>>();

export default function midiAtarHandle(
  socket: Socket<
    SocketToServerEvents,
    ServerToSocketEvents,
    InterServerEvents,
    SocketData
  >,
  host: RemoteSocket<HostServerToSocketEvents, HostSocketData>,
) {
  if (!midiAtarHosts.has(socket.data.hostId!)) {
    midiAtarHosts.set(socket.data.hostId!, new Map());
  }

  const keys = midiAtarHosts.get(socket.data.hostId!)!;
  socket.on("midiAtarKey", (key, pressed, cb) => {
    if (
      typeof key !== "number" || typeof pressed !== "boolean" ||
      (typeof cb !== "function" && cb !== undefined)
    ) {
      cb?.(false, "input");
      return;
    }

    const keyOwner = keys.get(key);

    if (!keyOwner && !pressed) {
      cb?.(false, "duplicate");
      return;
    }

    if (keyOwner && keyOwner !== socket.id) {
      cb?.(false, "ownership");
      return;
    }

    if (pressed) {
      keys.set(key, socket.id);
    } else {
      keys.delete(key);
    }

    socket.to(`${socket.data.hostId}-midiatar`)
      .emit("midiAtarKey", key, pressed, socket.id);
    host.emit("midiAtarKey", key, pressed, socket.id);

    cb?.(true);
  });

  socket.on("disconnect", () => {
    for (const [key, value] of keys) {
      if (value !== socket.id) continue;
      keys.delete(key);
      socket.to(`${socket.data.hostId}-midiatar`)
        .emit("midiAtarKey", key, false, socket.id);
      host.emit("midiAtarKey", key, false, socket.id);
    }
  });
}
