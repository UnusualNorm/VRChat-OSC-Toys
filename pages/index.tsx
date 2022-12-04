import Head from 'next/head';
import ActorCursorManager from '../components/CursorShare/Manager';
import HomeMenu from '../components/Home/Menu';

const Home = () => (
  <div>
    <Head>
      <title>Home</title>
    </Head>
    <ActorCursorManager group="Home" />
    <HomeMenu />
  </div>
);

export default Home;
