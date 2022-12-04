import { Server, Socket } from 'socket.io';

// This should mirror ../components/CursorShare/Manager
interface ListenEvents {
  joinRoom: (room: string) => void;
  moveCursor: (x: number, y: number) => void;
}

interface EmitEvents {
  addCursor: (id: string) => void;
  moveCursor: (id: string, x: number, y: number) => void;
  removeCursor: (id: string) => void;
}

const cursorShareHandler = (io: Server<ListenEvents, EmitEvents>) => {
  const CursorShare = io.of('/CursorShare');
  CursorShare.on('connection', (socket: Socket) => {
    socket.on('joinRoom', (room) => {
      console.log('CursorShare: Cursor joined room:', socket.id, room);
      socket.join(room);
      for (const [_, otherSocket] of CursorShare.sockets)
        if (otherSocket.rooms.has(room))
          socket.emit('addCursor', otherSocket.id);
      CursorShare.to(room).emit('addCursor', socket.id);
    });
    console.log('CursorShare: Cursor connected:', socket.id);

    socket.on('moveCursor', (x, y) => {
      console.log('CursorShare: Cursor moved:', socket.id, x, y);
      socket.rooms.forEach((room) =>
        CursorShare.to(room).emit('moveCursor', socket.id, x, y)
      );
    });

    socket.on('disconnect', () => {
      console.log('CursorShare: Cursor disconnected:', socket.id);
      socket.rooms.forEach((room) =>
        CursorShare.to(room).emit('removeCursor', socket.id)
      );
    });
  });
};
export default cursorShareHandler;
