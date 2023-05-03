import type { Handlers, PageProps } from "$fresh/server.ts";
import type { State } from "./_middleware.ts";

export const handler: Handlers<any, State> = {
  GET(_, ctx) {
    return ctx.render(ctx.state);
  },
};

export default function MidiAtar({ url, data }: PageProps<State>) {
  return (
    <>
      <h1>MidiAtar</h1>
      <p>url: {url}</p>
      <p>data: {JSON.stringify(data)}</p>
    </>
  );
}
