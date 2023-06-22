import type { ClientSocket } from "../client.ts";
import type { HostRemoteSocket } from "../host.ts";

export interface EmitEvents {
  midiAtarKey: (key: number, pressed: boolean) => void;
}

export interface ListenEvents {
  midiAtarKey: (
    key: number,
    pressed: boolean,
  ) => void;
}

export interface ServerSideEvents {}

export interface SocketData {}

export default function midiAtarHandle(
  socket: ClientSocket,
  host: HostRemoteSocket,
) {
  // FIXME: A note which failed to recieve ownership will not be replayed when ownership is freed.
  socket.on("midiAtarKey", (key, pressed) => {
    if (
      typeof key !== "number" || typeof pressed !== "boolean"
    ) {
      return;
    }

    host.emit("midiAtarKey", key, pressed, socket.id);
    socket.to(`${socket.data.hostId}-midiatar`).emit(
      "midiAtarKey",
      key,
      pressed,
    );
  });

  socket.on("disconnect", () => {
    host.emit("midiAtarClear", socket.id);
  });
}
