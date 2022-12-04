import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import styles from '../../styles/MidiAtar/Key.module.css';

export interface MidiAtarKeyProps {
  note: number;
  pressed: boolean;
  startNote: (note: number) => void;
  stopNote: (note: number) => void;
}

let primaryMouseButtonDown = false;
const MidiAtarKey = ({
  note,
  pressed,
  startNote,
  stopNote,
}: MidiAtarKeyProps) => {
  const ref = useRef<HTMLLIElement>();

  function setPrimaryButtonState(e) {
    const flags = e.buttons !== undefined ? e.buttons : e.which;
    primaryMouseButtonDown = (flags & 1) === 1;
  }

  const mouseEnter = () => {
    if (!primaryMouseButtonDown) return;
    console.log('Note on:', note);
    startNote(note);
  };

  const mouseDown = () => {
    console.log('Note on:', note);
    startNote(note);
  };

  const mouseLeave = () => {
    if (!primaryMouseButtonDown) return;
    console.log('Note off:', note);
    stopNote(note);
  };

  const mouseUp = () => {
    console.log('Note off:', note);
    stopNote(note);
  };

  useEffect(() => {
    document.addEventListener('mousedown', setPrimaryButtonState);
    document.addEventListener('mousemove', setPrimaryButtonState);
    document.addEventListener('mouseup', setPrimaryButtonState);

    ref.current.addEventListener('mouseenter', mouseEnter);
    ref.current.addEventListener('mousedown', mouseDown);
    ref.current.addEventListener('mouseleave', mouseLeave);
    ref.current.addEventListener('mouseup', mouseUp);

    return () => {
      document.removeEventListener('mousedown', setPrimaryButtonState);
      document.removeEventListener('mousemove', setPrimaryButtonState);
      document.removeEventListener('mouseup', setPrimaryButtonState);

      ref.current.removeEventListener('mouseenter', mouseEnter);
      ref.current.removeEventListener('mousedown', mouseDown);
      ref.current.removeEventListener('mouseleave', mouseLeave);
      ref.current.removeEventListener('mouseup', mouseUp);
    };
  }, []);

  const noteInOct = note % 12;
  let agfdc = false;
  let accidental = false;

  if (
    noteInOct == 2 ||
    noteInOct == 4 ||
    noteInOct == 7 ||
    noteInOct == 9 ||
    noteInOct == 11
  )
    agfdc = true;

  if (
    noteInOct == 1 ||
    noteInOct == 3 ||
    noteInOct == 6 ||
    noteInOct == 8 ||
    noteInOct == 10
  )
    accidental = true;

  return (
    <li
      ref={ref}
      className={`${styles.key} ${accidental ? styles.black : styles.white} ${
        agfdc ? styles.agfdc : ''
      } ${pressed ? styles.active : ''} ${styles.selector}`}
    />
  );
};

export default MidiAtarKey;
