import { Head } from "$fresh/runtime.ts";
import Hero from "../components/Hero.tsx";
import Carousel from "../islands/Carousel.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>VRC Toys - Home</title>
      </Head>
      <Hero />
      <Carousel />
    </>
  );
}
