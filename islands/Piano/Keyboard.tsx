import type { JSX } from "preact";
import type { NoteRange } from "../../types/piano.ts";
import { getAttributes, range } from "../../utils/midi.ts";

import Key from "./Key.tsx";

interface KeyboardProps {
  noteRange: NoteRange;
  activeNotes: number[];
  onPlayNoteInput: (midiNumber: number) => void;
  onStopNoteInput: (midiNumber: number) => void;
  renderNoteLabel?: (props: {
    isActive: boolean;
    isAccidental: boolean;
    midiNumber: number;
  }) => JSX.Element | null;
  keyWidthToHeight?: number;
  className?: string;
  disabled?: boolean;
  gliss?: boolean;
  useTouchEvents?: boolean;
  // If width is not provided, must have fixed width and height in parent container
  width?: number;
}

const Keyboard = ({
  noteRange,
  activeNotes,
  onPlayNoteInput,
  onStopNoteInput,
  renderNoteLabel = () => null,
  keyWidthToHeight = 0.33,
  className,
  disabled = false,
  gliss = false,
  useTouchEvents = false,
  width,
}: KeyboardProps) => {
  // Range of midi numbers on keyboard
  const getMidiNumbers = () => {
    return range(noteRange.first, noteRange.last + 1);
  };

  const getNaturalKeyCount = () =>
    getMidiNumbers().filter((number) => {
      const { isAccidental } = getAttributes(number);
      return !isAccidental;
    }).length;

  // Returns a ratio between 0 and 1
  const getNaturalKeyWidth = () => 1 / getNaturalKeyCount();

  const getWidth = () => width || "100%";

  const getHeight = () => {
    if (!width) {
      return "100%";
    }
    const keyWidth = width * getNaturalKeyWidth();
    return `${keyWidth / keyWidthToHeight}px`;
  };

  const naturalKeyWidth = getNaturalKeyWidth();
  return (
    <div
      className={`ReactPiano__Keyboard ${className}`}
      style={{ width: getWidth(), height: getHeight() }}
    >
      {getMidiNumbers().map((midiNumber) => {
        const { isAccidental } = getAttributes(midiNumber);
        const isActive = !disabled &&
          activeNotes.includes(midiNumber);
        return (
          <Key
            naturalKeyWidth={naturalKeyWidth}
            midiNumber={midiNumber}
            noteRange={noteRange}
            active={isActive}
            accidental={isAccidental}
            disabled={disabled!}
            onPlayNoteInput={onPlayNoteInput}
            onStopNoteInput={onStopNoteInput}
            gliss={gliss!}
            useTouchEvents={useTouchEvents!}
            key={midiNumber}
          >
            {disabled ? null : renderNoteLabel({
              isActive,
              isAccidental,
              midiNumber,
            })}
          </Key>
        );
      })}
    </div>
  );
};

export default Keyboard;
