import { Head } from "$fresh/runtime.ts";
import MidiAtarIsland from "../../islands/MidiAtar.tsx";

export default function MidiAtar() {
  return (
    <>
      <Head>
        <title>VRC Toys - MidiAtar</title>
      </Head>

      <div class="flex flex-col items-center justify-center">
        <div class="flex flex-col items-center justify-center w-full max-w-md p-4">
          <h1 class="text-4xl font-bold">MidiAtar</h1>
          <MidiAtarIsland />
        </div>
      </div>
    </>
  );
}