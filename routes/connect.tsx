import { deleteCookie, setCookie } from "std/http/cookie.ts";
import { Handler, Handlers, PageProps } from "$fresh/server.ts";

export default function MidiAtar({ url, data }: PageProps<State>) {
