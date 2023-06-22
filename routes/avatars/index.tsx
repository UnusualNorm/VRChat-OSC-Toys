import { Head } from "$fresh/runtime.ts";
import { PageProps } from "$fresh/server.ts";
import avatars from "../../static/avatars.json" assert { type: "json" };

export default function Avatars() {
  return (
    <>
      <Head>
        <title>VRC Toys - Avatars</title>
      </Head>

      <div class="flex flex-col items-center justify-center">
        <div class="flex flex-col items-center justify-center w-full max-w-md p-4">
          <h1 class="text-4xl font-bold">Avatar Emporium</h1>
          <p class="text-xl font-bold">Choose your avatar</p>

          <div class="flex flex-row flex-wrap justify-center">
            {avatars.map((avatar) => (
              <a
                href={`/avatars/${avatar.id}`}
                class="flex flex-col items-center justify-center m-2"
              >
                <img class="w-32 h-32" src={avatar.image} />
                <p class="text-xl font-bold">{avatar.name}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
