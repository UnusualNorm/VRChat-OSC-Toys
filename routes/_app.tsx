import type { AppProps } from "$fresh/server.ts";
import { asset, Head } from "$fresh/runtime.ts";
import Header from "../islands/Header.tsx";
import Footer from "../components/Footer.tsx";

export default function App({ Component }: AppProps) {
  return (
    <div class="wrapper">
      <Head>
        <link rel="stylesheet" href={asset("/styles/piano.css")} />
      </Head>
      <Header />
      <Component />
      <Footer />
    </div>
  );
}
