import { Server, Socket } from "socket.io";

// This should mirror ../components/CursorShare/Manager
interface ListenEvents {
  joinRoom: (room: string) => void;
  moveCursor: (position: [number, number]) => void;
}

interface EmitEvents {
  addCursor: (id: string) => void;
  moveCursor: (id: string, position: [number, number]) => void;
  removeCursor: (id: string) => void;
}

const cursorShareHandler = (io: Server<ListenEvents, EmitEvents>) => {
  const CursorShare = io.of("/CursorShare");
  CursorShare.on("connection", (socket: Socket) => {
    socket.on("joinRoom", (room) => {
      console.log("CursorShare: Cursor joined room:", socket.id, room);
      for (const [_, otherSocket] of CursorShare.sockets)
        if (otherSocket.rooms.has(room))
          socket.emit("addCursor", otherSocket.id);
      socket.join(room);
      CursorShare.to(room).emit("addCursor", socket.id);
    });
    console.log("CursorShare: Cursor connected:", socket.id);

    socket.on("moveCursor", (position) =>
      socket.rooms.forEach((room) =>
        CursorShare.to(room).emit("moveCursor", socket.id, position)
      )
    );

    socket.on("disconnect", () => {
      console.log("CursorShare: Cursor disconnected:", socket.id);
      socket.rooms.forEach((room) =>
        CursorShare.to(room).emit("removeCursor", socket.id)
      );
    });
  });
};

export default cursorShareHandler;
