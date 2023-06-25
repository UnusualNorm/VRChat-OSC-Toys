import { Handler } from "$fresh/server.ts";
import { getCookies } from "std/http/cookie.ts";
import { io } from "../main.ts";

export const validConnectionHandler = <T, State>(
  handler?: Handler<T, State>,
  checkValidity = true,
): Handler<T, State> =>
async (req, ctx) => {
  const url = new URL(req.url);

  if (!(await isConnected(req, checkValidity))) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login?redirect=" + encodeURIComponent(url.pathname),
      },
    });
  }

  return handler ? handler(req, ctx) : ctx.render();
};

export async function isConnected(session: Request, checkValidity = true) {
  const cookies = getCookies(session.headers);
  return cookies.hostId &&
    (!checkValidity || await isValidConnection(cookies.hostId));
}

export async function isValidConnection(hostId: string) {
  const Hosts = io.of("/host");
  const hosts = await Hosts.fetchSockets();
  return hosts.some((host) => host.id === hostId);
}
