import { AppProps } from "$fresh/server.ts";
import { IS_BROWSER } from "$fresh/runtime.ts";
import Header from "../islands/Header.tsx";
import Footer from "../components/Footer.tsx";

export default function App({ Component }: AppProps) {
  return (
    <div class="wrapper">
      <Header />
      <Component />
      <Footer />
    </div>
  );
}
