import IconChevronRight from "tabler_icons_tsx/chevron-right.tsx";

export default function Hero() {
  return (
    <div
      class="w-full flex px-8 h-96 justify-center items-center flex-col gap-8 bg-cover bg-center bg-no-repeat bg-gray-100 rounded-xl text-white"
      style="background-image:linear-gradient(rgba(0, 0, 40, 0.8),rgba(0, 0, 40, 0.8)), url('/gallery/hero-bg.webp');"
    >
      <div class="space-y-4 text-center">
        <h1 class="text-4xl inline-block font-bold">VRChat OSC Toys</h1>
        <p class="text-xl max-w-lg text-blue-100">
          VRChat OSC Toys is a collection of fun VRChat avatars utilizing
          VRChat's OSC API!
        </p>
      </div>

      <div>
        <a
          href="/avatars"
          class="block mt-4 text-blue-500 cursor-pointer inline-flex items-center group text-blue-800 bg-white px-8 py-2 rounded-md hover:bg-blue-50 font-bold"
        >
          Avatars{" "}
        </a>
        <a
          href="https://github.com/UnusualNorm/VRChat-OSC-Toys"
          class="block mt-4 transition-colors text-blue-400 cursor-pointer inline-flex items-center group px-4 py-2 hover:text-blue-100"
        >
          Source Code{" "}
          <IconChevronRight class="inline-block w-5 h-5 transition group-hover:translate-x-0.5" />
        </a>
      </div>
    </div>
  );
}
