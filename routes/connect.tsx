import { setCookie } from "std/http/cookie.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { io } from "../main.ts";

import { Head } from "$fresh/runtime.ts";
import Button from "../islands/Button.tsx";
import Input from "../islands/Input.tsx";

const redirectToConnect = (redirect?: string, invalid?: boolean) => {
  let location = `/connect?invalid=${!!invalid}`;
  if (redirect) {
    location += `&redirect=${encodeURIComponent(redirect)}`;
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
    },
  });
};

const getFormData = async (req: Request) => {
  try {
    return await req.formData();
  } catch {
    return null;
  }
};

const isValidFormData = (formData: FormData) => {
  const hostId = formData.get("hostId");
  return typeof hostId === "string";
};

export const handler: Handlers = {
  POST: async (req, ctx) => {
    const url = new URL(req.url);
    const redirect = url.searchParams.get("redirect") ?? undefined;
    const formData = await getFormData(req);

    if (!formData || !isValidFormData(formData)) {
      return redirectToConnect(redirect, true);
    }

    const hostId = formData.get("hostId") as string;

    const hosts = await io.of("/host").fetchSockets();
    for (const host of hosts) {
      if (host.id !== hostId) continue;
      const headers = new Headers();
      setCookie(headers, {
        name: "hostId",
        value: hostId,
      });

      headers.set("Location", redirect ?? "/avatars");
      return new Response(null, {
        status: 302,
        headers,
      });
    }

    return redirectToConnect(redirect, true);
  },
};

export default function Connect({ url }: PageProps) {
  const redirect = url.searchParams.get("redirect") ?? undefined;
  const invalid = url.searchParams.get("invalid") === "true";

  return (
    <>
      <Head>
        <title>VRC Toys - Connect</title>
      </Head>

      <div class="flex flex-col items-center justify-center">
        <div class="flex flex-col items-center justify-center w-full max-w-md p-4">
          <h1 class="text-4xl font-bold">VRC Toys</h1>
          <p class="text-gray-500">Connect to a host!</p>
          {invalid && <p class="text-red-500">Invalid id...</p>}
          <form
            class="flex flex-col items-center justify-center w-full mt-4"
            action={"/connect" + (redirect ? `?redirect=${redirect}` : "")}
            method="post"
          >
            <Input placeholder="ID" name="hostId" />
            <Button type="submit" class="mt-4">Connect</Button>
          </form>
        </div>
      </div>
    </>
  );
}
