import type { Namespace, Server, Socket } from "socket_io/mod.ts";
import type { RemoteSocket } from "socket_io/packages/socket.io/lib/broadcast-operator.ts";
import type { HostNamespace, HostRemoteSocket } from "./host.ts";

import midiAtarHandle, {
  type EmitEvents as MidiAtarEmitEvents,
  type ListenEvents as MidiAtarListenEvents,
  type ServerSideEvents as MidiAtarServerSideEvents,
  type SocketData as MidiAtarSocketData,
} from "./avatars/midiAtar.ts";

import signAtarHandle, {
  type EmitEvents as SignAtarEmitEvents,
  type ListenEvents as SignAtarListenEvents,
  type ServerSideEvents as SignAtarServerSideEvents,
  type SocketData as SignAtarSocketData,
} from "./avatars/signAtar.ts";

export interface EmitEvents extends MidiAtarEmitEvents, SignAtarEmitEvents {
  banned: () => void;
  avatarBanned: () => void;
}

export interface ListenEvents
  extends MidiAtarListenEvents, SignAtarListenEvents {}

export interface ServerSideEvents
  extends MidiAtarServerSideEvents, SignAtarServerSideEvents {}

export interface SocketData extends MidiAtarSocketData, SignAtarSocketData {
  hostId: string;
  avatar: string;
}

export type ClientRemoteSocket = RemoteSocket<EmitEvents, SocketData>;
export type ClientSocket = Socket<
  ListenEvents,
  EmitEvents,
  ServerSideEvents,
  SocketData
>;

export type ClientNamespace = Namespace<
  ListenEvents,
  EmitEvents,
  ServerSideEvents,
  SocketData
>;

export default function clientHandle(
  io: Server,
) {
  const Clients = io.of("/") as ClientNamespace;
  const Hosts = io.of("/host") as HostNamespace;

  Clients.on("connection", async (socket) => {
    const hostId = socket.handshake.query.get("hostId");
    const avatar = socket.handshake.query.get("avatar");
    if (!hostId || !avatar) {
      socket.disconnect();
      return;
    }

    const hosts = await Hosts.fetchSockets();
    let host!: HostRemoteSocket;
    for (const newHost of hosts) {
      if (newHost.id !== hostId) continue;

      if (newHost.data.bannedIps.includes(socket.handshake.address)) {
        socket.emit("banned");
        socket.disconnect();
        return;
      }

      if (newHost.data.disallowedAvatars.includes(avatar)) {
        socket.emit("avatarBanned");
        socket.disconnect();
        return;
      }

      host = newHost;
      socket.data.hostId = hostId;
      socket.data.avatar = avatar;
      break;
    }

    if (!socket.data.hostId) {
      socket.disconnect();
      return;
    }

    await socket.join(socket.data.hostId);
    await socket.join(socket.data.avatar!);
    await socket.join(`${socket.data.hostId}-${socket.data.avatar}`);

    host.emit("clientConnected", socket.id, socket.data.avatar!);

    switch (socket.data.avatar) {
      case "midiatar":
        midiAtarHandle(socket, host);
        break;
      case "signatar":
        signAtarHandle(socket, host);
        break;
      default:
        socket.disconnect();
        return;
    }

    console.log(
      `Client ${socket.id} connected to host ${hostId} with avatar ${socket.data.avatar}!`,
    );
    socket.on("disconnect", () => {
      console.log(`Client ${socket.id} disconnected!`);
    });
  });
}
