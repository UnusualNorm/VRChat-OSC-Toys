import { IS_BROWSER } from "$fresh/runtime.ts";
import LemonIcon from "tabler_icons_tsx/lemon-2.tsx";

type Props = {
  active?: string;
};

export default function Header({ active }: Props) {
  const menus = [
    { name: "Home", href: "/" },
    { name: "Connect", href: "/connect" },
    { name: "Avatars", href: "/avatars" },
  ];

  if (!active && IS_BROWSER) {
    active = window.location.pathname;
  }

  return (
    <div class="bg-white w-full max-w-screen-lg py-6 px-8 flex flex-col md:flex-row gap-4">
      <div class="flex items-center flex-1">
        <LemonIcon />
        <div class="text-2xl  ml-1 font-bold">
          VRC Toys
        </div>
      </div>
      <ul class="flex items-center gap-6">
        {menus.map((menu) => (
          <li>
            <a
              href={menu.href}
              class={"text-gray-500 hover:text-gray-700 py-1 border-gray-500" +
                (menu.href === active ? " font-bold border-b-2" : "")}
            >
              {menu.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
