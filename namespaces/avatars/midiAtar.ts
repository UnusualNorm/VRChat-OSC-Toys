import type { ClientSocket } from "../client.ts";
import type { HostRemoteSocket } from "../host.ts";

export interface EmitEvents {
  midiAtarKey: (key: number, pressed: boolean, client: string) => void;
}

export interface ListenEvents {
  midiAtarKey: (
    key: number,
    pressed: boolean,
    cb?:
      & ((success: true) => void)
      & ((success: false, reason: "ownership" | "duplicate") => void),
  ) => void;
}

export interface ServerSideEvents {}

export interface SocketData {}

const baseNote = 84;
const calculateNoteVal = (note: number) =>
  Math.pow(2, (note - baseNote) / 12) / 3;
const noteChannels = 8;

const midiAtarKeyboards = new Map<string, Map<number, string>>();
const midiAtarChannels = new Map<string, (number | undefined)[]>();

export default function midiAtarHandle(
  socket: ClientSocket,
  host: HostRemoteSocket,
) {
  if (!midiAtarKeyboards.has(socket.data.hostId!)) {
    midiAtarKeyboards.set(socket.data.hostId!, new Map());
  }

  // FIXME: A note which failed to recieve ownership will not be replayed when ownership is freed.
  const keys = midiAtarKeyboards.get(socket.data.hostId!)!;
  socket.on("midiAtarKey", (key, pressed, cb) => {
    if (
      typeof key !== "number" || typeof pressed !== "boolean" ||
      (typeof cb !== "function" && cb !== undefined)
    ) {
      return;
    }

    // If there is a keyOwner, that also means that the key is pressed
    const keyOwner = keys.get(key);
    if (keyOwner && keyOwner !== socket.id) {
      cb?.(false, "ownership");
      return;
    }

    // If we are trying to press an already pressed key
    if (keyOwner && pressed) {
      cb?.(false, "duplicate");
      return;
    }

    // If we are trying to release an already released key
    if (!keyOwner && !pressed) {
      cb?.(false, "duplicate");
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
    for (const [key, owner] of keys) {
      if (owner !== socket.id) continue;
      keys.delete(key);
      socket.to(`${socket.data.hostId}-midiatar`)
        .emit("midiAtarKey", key, false, socket.id);
      host.emit("midiAtarKey", key, false, socket.id);
    }
  });
}
