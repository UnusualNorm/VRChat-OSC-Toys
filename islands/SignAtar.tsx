import { IS_BROWSER } from "$fresh/runtime.ts";
import { useEffect, useState } from "preact/hooks";
import { useSocket } from "../utils/socket.io.ts";

import ControlledDial from "./Dial/ControlledDial.tsx";

const parseCookies = (cookie: string) => {
  const out: Record<string, string> = {};
  const c = cookie.split(";");

  for (const kv of c) {
    const [cookieKey, ...cookieVal] = kv.split("=");
    const key = cookieKey.trim();
    out[key] = cookieVal.join("=");
  }

  return out;
};

interface SignAtarProps {
  length?: number;
  values?: string[];
  predict?: boolean;
}

const SignAtar = ({
  length = 8,
  values = " ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  predict = true,
}: SignAtarProps) => {
  if (!IS_BROWSER) {
    return (
      <div>
        <p>Please enable Javascript.</p>
      </div>
    );
  }

  const socket = useSocket({
    query: {
      hostId: parseCookies(document.cookie).hostId,
      avatar: "signatar",
    },
  });

  const [indexes, setIndexes] = useState(
    Array(length).fill(0),
  );

  useEffect(() => {
    socket?.on("signAtarIDR", (idr) => {
      setIndexes(idr);
    });

    socket?.on("signAtarI", (dialIndex, newValue) => {
      setIndexes((indexes) =>
        indexes.map((v, i) => i === dialIndex ? newValue : v)
      );
    });
  }, [socket]);

  const requestValueChange = (up: boolean, dialIndex: number) => {
    let newValue = up ? indexes[dialIndex] - 1 : indexes[dialIndex] + 1;

    if (newValue < 0) {
      newValue = values.length - 1;
    } else if (newValue >= values.length) {
      newValue = 0;
    }

    socket?.emit("signAtarI", dialIndex, newValue);

    // A wee bit dangerous, there's a chance the host refuses the change, and now we're desynced
    if (predict) {
      setIndexes(indexes.map((v, i) => i === dialIndex ? newValue : v));
    }
  };

  return (
    <div className="flex flex-row justify-center">
      {indexes.map((index, dialIndex) => (
        // TODO: Transition to ControlledDial
        <ControlledDial
          key={dialIndex}
          value={values[index]}
          changeValue={(up) => requestValueChange(up, dialIndex)}
        />
      ))}
    </div>
  );
};

export default SignAtar;
