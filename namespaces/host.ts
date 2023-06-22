import type { Namespace, Server, Socket } from "socket_io/mod.ts";
import type { RemoteSocket } from "socket_io/packages/socket.io/lib/broadcast-operator.ts";
import type { ClientNamespace } from "./client.ts";
import type { Message } from "https://deno.land/x/osc@v0.1.0/mod.ts";

export interface EmitEvents {
  clientConnected: (client: string, avatar: string) => void;
  clientDisconnected: (client: string) => void;
  param: (
    path: string,
    values: (Parameters<Message["append"]>)[],
    blame?: string,
  ) => void;

  signAtarI: (dial: number, value: number, blame?: string) => void;
  signAtarIDR: (cb: (idr: number[]) => void) => void;
}

export interface ListenEvents {
  banClient: (client: string) => void;
}

export interface ServerSideEvents {
}

export interface SocketData {
  disallowedAvatars: string[];
  bannedIps: string[];
}

export type HostRemoteSocket = RemoteSocket<EmitEvents, SocketData>;
export type HostSocket = Socket<
  ListenEvents,
  EmitEvents,
  ServerSideEvents,
  SocketData
>;

export type HostNamespace = Namespace<
  ListenEvents,
  EmitEvents,
  ServerSideEvents,
  SocketData
>;

export default function hostHandle(
  io: Server,
) {
  const Clients = io.of("/") as ClientNamespace;

  const Hosts = io.of("/host") as HostNamespace;

  Hosts.on("connection", (socket) => {
    const disallowedAvatars =
      socket.handshake.query.get("disallowedAvatars")?.split(",") ?? [];
    socket.data.disallowedAvatars = disallowedAvatars;

    const bannedIps = socket.handshake.query.get("bannedIps")?.split(",") ?? [];
    socket.data.bannedIps = bannedIps;

    console.log(`Host ${socket.id} connected!`);
    socket.on("banClient", async (clientId) => {
      console.log(`Host ${socket.id} banned client ${clientId}...`);
      const clients = await Clients.in(socket.id).fetchSockets();
      for (const client of clients) {
        if (client.id !== clientId) continue;
        socket.data.bannedIps!.push(client.handshake.address);
        client.emit("banned");
        client.disconnect(true);
        break;
      }
    });

    socket.on("disconnect", async () => {
      console.log(`Host ${socket.id} disconnected...`);
      const clients = await Clients.fetchSockets();
      for (const client of clients) {
        if (client.data.hostId !== socket.id) continue;
        client.disconnect(true);
      }
    });
  });
}
