import type {
  EmitEvents as ListenEvents,
  ListenEvents as EmitEvents,
} from "../namespaces/client.ts";

import { useEffect, useState } from "preact/hooks";
import io, {
  type ManagerOptions,
  type Socket,
  type SocketOptions,
} from "https://esm.sh/socket.io-client@4.6.2?target=es2020";

export function useSocket(
  opts?: Partial<ManagerOptions & SocketOptions> | undefined,
) {
  const [socket, setSocket] = useState<Socket<ListenEvents, EmitEvents> | null>(
    null,
  );

  useEffect(() => {
    const socket = io(opts);
    setSocket(socket);
    socket.once(
      "disconnect",
      () => window.location.replace("/connect"),
    );

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [JSON.stringify(opts)]);

  return socket;
}
