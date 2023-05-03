import type { Namespace, Server } from "socket_io";
import type {
  InterServerEvents as ClientInterServerEvents,
  ServerToSocketEvents as ClientServerToSocketEvents,
  SocketData as ClientSocketData,
  SocketToServerEvents as ClientSocketToServerEvents,
} from "./client.ts";

export interface ServerToSocketEvents {
  clientConnected: (client: string, avatar: string) => void;
  midiAtarKey: (key: number, pressed: boolean, client: string) => void;
}

export interface SocketToServerEvents {
  banClient: (client: string) => void;
}

export interface InterServerEvents {
}

export interface SocketData {
  disallowedAvatars: string[];
  bannedIps: string[];
}

export default function hostHandle(
  io: Server,
) {
  const Clients = io as Server<
    ClientSocketToServerEvents,
    ClientServerToSocketEvents,
    ClientInterServerEvents,
    ClientSocketData
  >;

  const Hosts = io.of("/host") as Namespace<
    SocketToServerEvents,
    ServerToSocketEvents,
    InterServerEvents,
    SocketData
  >;

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

    socket.on("disconnect", () => {
      console.log(`Host ${socket.id} disconnected...`);
    });
  });
}
