import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import Cursor from './Cursor';

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

// This should mirror ../components/CursorShare/Manager
interface EmitEvents {
  joinRoom: (room: string) => void;
  moveCursor: (x: number, y: number) => void;
}

interface ListenEvents {
  addCursor: (id: string) => void;
  moveCursor: (id: string, x: number, y: number) => void;
  removeCursor: (id: string) => void;
}

let socket: Socket<ListenEvents, EmitEvents>;
export interface CursorShareManagerProps {
  group: string;
}

const fps = 10;
const CursorShareManager = ({ group }: CursorShareManagerProps) => {
  const [cursorList, setCursorList] = useState<string[]>([]);
  let mousePos = {
    x: 0,
    y: 0,
  };
  let mouseTime = 0;

  const socketInitializer = async () => {
    await fetch('/api/socket');
    socket = io('/CursorShare');

    socket.on('connect', () => {
      socket.emit('joinRoom', group);
      console.log('Connected to CursorShare socket!');
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setCursorList([]);
    });

    socket.on('addCursor', (id) => {
      if (socket.id == id) return console.log('Joined CursorShare group!');
      setCursorList(cursorList.concat([id]));
    });
    socket.on('removeCursor', (id) =>
      setCursorList(cursorList.filter((oldId) => oldId != id))
    );
  };

  const timeThreshold = (1 / fps) * 1000;
  const onMouseMove = (e: MouseEvent) => {
    if (Date.now() - mouseTime <= timeThreshold) return;
    if (distance(mousePos, e) < 5) return;
    mousePos = e;
    mouseTime = Date.now();
    socket?.emit('moveCursor', e.x, e.y);
  };

  useEffect(() => {
    socketInitializer();

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);
  return (
    <div>
      {cursorList.map((id) => (
        <Cursor socket={socket} key={id} id={id} fps={fps} />
      ))}
    </div>
  );
};

export default CursorShareManager;
