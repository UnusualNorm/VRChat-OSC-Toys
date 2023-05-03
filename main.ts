/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { ServerContext, StartOptions } from "$fresh/server.ts";
import { Server } from "socket_io";
import { serve } from "std/http/server.ts";
import manifest from "./fresh.gen.ts";

import clientHandle from "./namespaces/client.ts";
import hostHandle from "./namespaces/host.ts";

import twindPlugin from "$fresh/plugins/twind.ts";
import twindConfig from "./twind.config.ts";

const io = new Server({
  "cors": {
    "origin": "*",
  },
});

clientHandle(io);
hostHandle(io);

const opts: StartOptions = { plugins: [twindPlugin(twindConfig)] };

const ctx = await ServerContext.fromManifest(manifest, opts);
await serve(io.handler(ctx.handler()), opts);
