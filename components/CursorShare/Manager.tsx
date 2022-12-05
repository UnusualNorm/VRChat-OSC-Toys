import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import Cursor from "./Cursor";

const distance = (a: [number, number], b: [number, number]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);

export interface CursorShareManagerProps {
  group: string;
}

const CursorShareManager = ({ group }: CursorShareManagerProps) => {
  const socketRef = useRef<Socket>();
  const [cursors, setCursors] = useState<[string, [number, number]][]>([]);

  const fps = 15;
  const timeThreshold = (1 / fps) * 1000;
  const mousePos = useRef<[number, number]>([0, 0]);
  const mouseTime = useRef<number>(0);

  const onMouseMove = (e: MouseEvent) => {
    const position: [number, number] = [e.x, e.y];
    if (Date.now() - mouseTime.current <= timeThreshold) return;
    if (distance(mousePos.current, position) < 5) return;
    mousePos.current = position;
    mouseTime.current = Date.now();
    socketRef.current.emit("moveCursor", position);
  };

  useEffect(() => {
    if (!socketRef.current) socketRef.current = io("/CursorShare");
    const socket = socketRef.current;

    socket.on("connect", () => {
      socket.emit("joinRoom", group);
      console.log("Connected to CursorShare socket:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from CursorShare socket:", reason);
      setCursors([]);
    });

    // This event also triggers for us, just in case we want to be sure that we've connected
    socket.on("addCursor", (id) =>
      setCursors((cursors) => {
        if (socket.id == id) {
          console.log("Joined CursorShare group:", group);
          return cursors;
        }
        console.log("Cursor has connected:", id);
        cursors.push([id, [0, 0]]);
        return [...cursors];
      })
    );

    // socket.on("moveCursor", (id, position) =>
    //   setCursors((cursors) => {
    //     if (id == socket.id) return cursors;
    //     const i = cursors.findIndex((cursorData) => cursorData[0] == id);
    //     if (i < 0) {
    //       console.warn("Unknown cursor has moved:", id, position);
    //       return cursors;
    //     }

    //     console.log("Cursor has moved:", id, position);
    //     cursors[i] = [cursors[i][0], position];
    //     return [...cursors];
    //   })
    // );

    socket.on("removeCursor", (id) =>
      setCursors((cursors) => {
        const i = cursors.findIndex((cursorData) => cursorData[0] == id);
        if (i < 0) {
          console.warn("Unknown cursor has disconnected:", id);
          return cursors;
        }

        console.log("Cursor has disconnected:", id);
        cursors.splice(i, 1);
        return cursors;
      })
    );

    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("addCursor");
      socket.off("moveCursor");
      socket.off("removeCursor");
    };
  }, []);

  return (
    <div>
      {cursors.map((cursorData) => (
        <Cursor
          key={cursorData[0]}
          id={cursorData[0]}
          socket={socketRef.current}
        />
      ))}
    </div>
  );
};

export default CursorShareManager;
