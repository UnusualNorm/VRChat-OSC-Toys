import type { MiddlewareHandlerContext } from "$fresh/server.ts";
import { getCookies } from "std/http/cookie.ts";

export interface ConnectionSettings {
  hostId: string;
}

export interface State {
  hostId: string;
}

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  const cookies = getCookies(req.headers);
  const hostId = cookies.hostId;
  if (!hostId) {
    const resp = new Response(null, {
      status: 302,
      headers: {
        Location: "/connect",
      },
    });
    return resp;
  }

  const resp = await ctx.next();
  return resp;
}
