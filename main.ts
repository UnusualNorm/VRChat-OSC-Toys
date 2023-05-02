/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { ServerContext, StartOptions } from "$fresh/server.ts";
import { serve } from "std/http/server.ts";
import manifest from "./fresh.gen.ts";

import twindPlugin from "$fresh/plugins/twind.ts";
import twindConfig from "./twind.config.ts";

const opts: StartOptions = { plugins: [twindPlugin(twindConfig)] };

const ctx = await ServerContext.fromManifest(manifest, opts);
await serve(ctx.handler(), opts);
