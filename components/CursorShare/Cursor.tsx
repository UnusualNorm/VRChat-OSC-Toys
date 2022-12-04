import type { Socket } from 'socket.io-client';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from '../../styles/CursorShare/Cursor.module.css';
import { directstyled, useDirectStyle } from 'direct-styled';

const lerp = (v0: number, v1: number, t: number) => v0 * (1 - t) + v1 * t;

// This should mirror ./Manager
interface EmitEvents {
  joinRoom: (room: string) => void;
  moveCursor: (x: number, y: number) => void;
}

interface ListenEvents {
  addCursor: (id: string) => void;
  moveCursor: (id: string, x: number, y: number) => void;
  removeCursor: (id: string) => void;
}

export interface CursorShareCursorProps {
  socket: Socket<ListenEvents, EmitEvents>;
  id: string;
  fps: number;
}

const CursorShareCursor = ({ socket, id, fps }: CursorShareCursorProps) => {
  const requestRef = useRef<number>();
  const [style, setStyle] = useDirectStyle();

  let position = [0, 0];
  let target = [0, 0];
  let lastFrame = 0;
  const animate = () => {
    const now = Date.now();
    const delta = now - lastFrame;

    const x = lerp(position[0], target[0], (delta / 1000) * 8);
    const y = lerp(position[1], target[1], (delta / 1000) * 8);

    position = [x, y];
    setStyle({
      content: 'url(https://cdn-icons-png.flaticon.com/512/6002/6002300.png)',
      left: position[0] - 5 + 'px',
      top: position[1] + 'px',
    });
    lastFrame = now;
    requestRef.current = requestAnimationFrame(animate);
  };

  const onMoveCursor = (targetId: string, x: number, y: number) => {
    if (targetId != id) return;
    target = [x, y];
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    socket.on('moveCursor', onMoveCursor);

    return () => {
      socket.off('moveCursor', onMoveCursor);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return <directstyled.img className={styles.cursor} style={style} />;
};

export default CursorShareCursor;
