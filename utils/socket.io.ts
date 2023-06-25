import type {
  EmitEvents as ListenEvents,
  ListenEvents as EmitEvents,
} from "../namespaces/client.ts";

import { useEffect, useRef } from "preact/hooks";
import io, {
  type ManagerOptions,
  type Socket,
  type SocketOptions,
} from "https://esm.sh/socket.io-client@4.6.2?target=es2020";

export function useSocket(
  opts?: Partial<ManagerOptions & SocketOptions> | undefined,
) {
  const socketRef = useRef<Socket<ListenEvents, EmitEvents> | null>(
    null,
  );

  useEffect(() => {
    const socket = io(opts);
    socketRef.current = socket;
    socket.on(
      "disconnect",
      (reason) => {
        console.log(`Socket disconnected due to ${reason}...`);
        if (reason === "io server disconnect") {
          // TODO: Make this not nuke all cookies
          document.cookie = "";
          window.location.replace("/connect");
        }
      },
    );

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [JSON.stringify(opts)]);

  return socketRef;
}
