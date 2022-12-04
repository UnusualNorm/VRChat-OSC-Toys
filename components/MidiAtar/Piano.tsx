import MidiAtarKey from './Key';
import styles from '../../styles/MidiAtar/Piano.module.css';
import { ReactNode } from 'react';
import { Socket } from 'socket.io-client';

export interface MidiAtarPianoProps {
  startingNote: number;
  endingNote: number;
  socket: Socket;
}

const MidiAtarPiano = ({
  startingNote,
  endingNote,
  socket,
}: MidiAtarPianoProps) => {

  return (
    
  );
};

export default MidiAtarPiano;
