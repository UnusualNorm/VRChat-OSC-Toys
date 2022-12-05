import { useEffect } from "react";
import "../styles/globals.css";

const App = ({ Component, pageProps }) => {
  useEffect(() => {
    (async function () {
      await fetch("/api/socket");
    })();
  }, []);

  return <Component {...pageProps} />;
};

export default App;
