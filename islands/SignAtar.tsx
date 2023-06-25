import type { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { useEffect, useState } from "preact/hooks";
import { useSocket } from "../utils/socket.io.ts";

import ControlledDial from "./Dial/ControlledDial.tsx";
import Input from "./Input.tsx";

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

// TODO: Split up functions to make it easier to read
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

  const socketRef = useSocket({
    query: {
      hostId: parseCookies(document.cookie).hostId,
      avatar: "signatar",
    },
  });

  const [indexes, setIndexes] = useState(
    Array(length).fill(0),
  );

  useEffect(() => {
    console.log("Setting up socket...");
    socketRef.current?.on("signAtarIDR", (idr) => {
      setIndexes(idr);
    });

    socketRef.current?.on("signAtarI", (dialIndex, newValue) => {
      setIndexes((indexes) =>
        indexes.map((v, i) => i === dialIndex ? newValue : v)
      );
    });

    return () => {
      console.log("Cleaning up socket...");
      socketRef.current?.off("signAtarIDR");
      socketRef.current?.off("signAtarI");
    };
  }, [socketRef]);

  const requestValueChange = (up: boolean, dialIndex: number) => {
    let newValue = up ? indexes[dialIndex] - 1 : indexes[dialIndex] + 1;
    console.log(
      `Requesting value change from ${values[indexes[dialIndex]]} to ${
        values[newValue]
      }...`,
    );

    if (newValue < 0) {
      newValue = values.length - 1;
    } else if (newValue >= values.length) {
      newValue = 0;
    }

    socketRef.current?.emit("signAtarI", dialIndex, newValue);

    // A wee bit dangerous, there's a chance the host refuses the change, and now we're desynced
    if (predict) {
      setIndexes(indexes.map((v, i) => i === dialIndex ? newValue : v));
    }
  };

  const applyInput = (
    e: JSX.TargetedEvent<HTMLInputElement, Event>,
  ) => {
    // If the input isn't currently active, don't do anything
    if (e.currentTarget !== document.activeElement) {
      console.log("Not submitting input, input not active...");
      return;
    }

    console.log("Submitting input...");
    const input = e.currentTarget.value.toUpperCase();
    const newIndexes = Array(length).fill(0);

    for (let i = 0; i < length; i++) {
      const index = values.indexOf(input[i]);
      if (index !== -1) {
        newIndexes[i] = index;
        socketRef.current?.emit("signAtarI", i, index);
      } else {
        newIndexes[i] = 0;
        socketRef.current?.emit("signAtarI", i, 0);
      }
    }

    // A wee bit dangerous, there's a chance the host refuses the change, and now we're desynced
    if (predict) {
      setIndexes(newIndexes);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-row justify-center">
        {indexes.map((index, dialIndex) => (
          <ControlledDial
            key={dialIndex}
            value={values[index]}
            changeValue={(up) => requestValueChange(up, dialIndex)}
          />
        ))}
      </div>
      <Input
        placeholder="Text"
        value={indexes.map((index) => values[index]).join("").trimEnd()}
        onChange={applyInput}
        onInput={(e) => {
          e.currentTarget.value = e.currentTarget.value.toUpperCase();
          e.currentTarget.value = e.currentTarget.value.substring(0, length);
        }}
      />
    </div>
  );
};

export default SignAtar;
