/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { ServerContext, StartOptions } from "$fresh/server.ts";
import { serve } from "std/http/server.ts";
import manifest from "./fresh.gen.ts";

import { type Namespace, Server } from "socket_io/mod.ts";
import { createAdapter } from "./adapter.ts";
import { InMemoryAdapter } from "socket_io/packages/socket.io/lib/adapter.ts";

import clientHandle from "./namespaces/client.ts";
import hostHandle from "./namespaces/host.ts";

import twindPlugin from "$fresh/plugins/twind.ts";
import twindConfig from "./twind.config.ts";

export const io = new Server({
  "cors": {
    "origin": "*",
  },
  // BroadcastChannel is not available for local testing.
  // @ts-ignore Double standards! Code for the in-memory adapter creator is taken directly from the defults.
  adapter: globalThis.BroadcastChannel ? createAdapter() : (
    nsp: Namespace,
  ) => new InMemoryAdapter(nsp),
});

clientHandle(io);
hostHandle(io);

const opts: StartOptions = { plugins: [twindPlugin(twindConfig)] };

// @ts-ignore /shrug
const ctx = await ServerContext.fromManifest(manifest, opts);
await serve(io.handler(ctx.handler()), opts);
