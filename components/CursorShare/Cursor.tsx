import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import styles from "../../styles/CursorShare/Cursor.module.css";

const lerp = (v0: number, v1: number, t: number) => v0 * (1 - t) + v1 * t;

export interface CursorShareCursorProps {
  id: string;
  socket: Socket;
}

const CursorShareCursor = ({ id, socket }: CursorShareCursorProps) => {
  const ref = useRef<HTMLImageElement>();
  const requestRef = useRef<number>();

  const targetRef = useRef<[number, number]>([0, 0]);
  const positionRef = useRef<[number, number]>([0, 0]);
  const lastFrame = useRef<number>(Date.now());
  const animate = () => {
    const now = Date.now();
    const delta = now - lastFrame.current;
    const position = positionRef.current;
    const target = targetRef.current;

    const x = lerp(position[0], target[0], (delta / 1000) * 8);
    const y = lerp(position[1], target[1], (delta / 1000) * 8);

    Object.assign(ref.current.style, {
      left: x - 5 + "px",
      top: y + "px",
    });
    positionRef.current = [x, y];
    lastFrame.current = now;
    requestRef.current = requestAnimationFrame(animate);
  };

  const onCursorMove = (cursorId: string, position: [number, number]) => {
    if (cursorId != id) return;
    console.log("Cursor has moved:", id, position);
    targetRef.current = position;
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    socket.on("moveCursor", onCursorMove);

    return () => {
      socket.off("moveCursor", onCursorMove);
      cancelAnimationFrame(requestRef.current);
    };
  });

  return (
    <img
      src="https://cdn-icons-png.flaticon.com/512/6002/6002300.png"
      ref={ref}
      className={styles.cursor}
      style={{
        left: positionRef.current[0] - 5 + "px",
        top: positionRef.current[1] + "px",
      }}
    />
  );
};

export default CursorShareCursor;
