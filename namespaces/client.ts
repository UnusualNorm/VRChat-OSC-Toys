import type { Namespace, Server, Socket } from "socket_io";
import type {
  InterServerEvents as HostInterServerEvents,
  ServerToSocketEvents as HostServerToSocketEvents,
  SocketData as HostSocketData,
  SocketToServerEvents as HostSocketToServerEvents,
} from "./host.ts";

import midiAtarHandle from "./avatars/midiAtar.ts";
import { RemoteSocket } from "https://deno.land/x/socket_io@0.2.0/packages/socket.io/lib/broadcast-operator.ts";

export interface ServerToSocketEvents {
  banned: () => void;
}

export interface SocketToServerEvents {}

export interface InterServerEvents {}

export interface SocketData {
  hostId: string;
  avatar: string;
}

export default function hostHandle(
  io: Server,
) {
  const Clients = io as Server<
    SocketToServerEvents,
    ServerToSocketEvents,
    InterServerEvents,
    SocketData
  >;

  const Hosts = io.of("/host") as Namespace<
    HostSocketToServerEvents,
    HostServerToSocketEvents,
    HostInterServerEvents,
    HostSocketData
  >;

  Clients.on("connection", async (socket) => {
    const hostId = socket.handshake.query.get("hostId");
    const avatar = socket.handshake.query.get("avatar");
    if (!hostId || !avatar) {
      socket.disconnect(true);
      return;
    }

    const hosts = await Hosts.fetchSockets();
    let host!: RemoteSocket<HostServerToSocketEvents, HostSocketData>;
    for (const newHost of hosts) {
      if (newHost.id !== hostId) continue;

      if (newHost.data.bannedIps.includes(socket.handshake.address)) {
        socket.emit("banned");
        socket.disconnect(true);
        return;
      }

      if (newHost.data.disallowedAvatars.includes(avatar)) {
        socket.disconnect(true);
        return;
      }

      host = newHost;
      socket.data.hostId = hostId;
      socket.data.avatar = avatar;
      break;
    }

    if (!socket.data.hostId) {
      socket.disconnect(true);
      return;
    }

    await socket.join(socket.data.hostId);
    await socket.join(socket.data.avatar!);
    await socket.join(`${socket.data.hostId}-${socket.data.avatar}`);

    host.emit("clientConnected", socket.id, socket.data.avatar!);

    switch (socket.data.avatar) {
      case "midiatar":
        // TODO: Fix this type error
        midiAtarHandle(socket as any, host);
        break;
    }

    console.log(
      `Client ${socket.id} connected to host ${hostId} with avatar ${socket.data.avatar}!`,
    );
    socket.on("disconnect", () => {
      console.log(`Client ${socket.id} disconnected!`);
    });
  });
}
