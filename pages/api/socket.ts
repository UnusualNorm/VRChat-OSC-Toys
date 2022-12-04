import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import { Server as IOServer } from 'socket.io';
import cursorShareHandler from '../../namespaces/CursorShare';
import midiAtarHandler from '../../namespaces/MidiAtar';

export type IOResponse = {
  socket: {
    server: HTTPServer & {
      io: IOServer;
    };
  };
};

const SocketHandler = (
  req: NextApiRequest,
  res: NextApiResponse & IOResponse
) => {
  if (res.socket.server.io) {
    console.log('Socket.IO: Server already initiated');
    res.end();
    return;
  }

  const io = new IOServer(res.socket.server);
  res.socket.server.io = io;

  cursorShareHandler(io);
  midiAtarHandler(io);

  console.log('Socket.IO: Initiated server');
  res.end();
};

export default SocketHandler;
