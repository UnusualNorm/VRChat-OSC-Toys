import { Head } from "$fresh/runtime.ts";
import SignAtarIsland from "../../islands/SignAtar.tsx";

export default function SignAtar() {
  return (
    <>
      <Head>
        <title>VRC Toys - SignAtar</title>
      </Head>

      <div class="flex flex-col items-center justify-center">
        <div class="flex flex-col items-center justify-center w-full max-w-md p-4">
          <h1 class="text-4xl font-bold">SignAtar</h1>
          <SignAtarIsland />
        </div>
      </div>
    </>
  );
}
