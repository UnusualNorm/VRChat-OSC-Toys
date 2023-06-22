import type { ComponentChildren } from "preact";
import type { NoteRange } from "../../types/piano.ts";
import { getAttributes } from "../../utils/midi.ts";

interface KeyProps {
  midiNumber: number;
  naturalKeyWidth: number; // Width as a ratio between 0 and 1
  gliss: boolean;
  useTouchEvents: boolean;
  accidental: boolean;
  active: boolean;
  disabled: boolean;
  onPlayNoteInput: (midiNumber: number) => void;
  onStopNoteInput: (midiNumber: number) => void;
  accidentalWidthRatio?: number;
  pitchPositions?: Record<string, number>;
  children?: ComponentChildren;

  noteRange: NoteRange;
}

const Key = ({
  midiNumber,
  naturalKeyWidth,
  gliss,
  useTouchEvents,
  accidental,
  active,
  disabled,
  onPlayNoteInput: upOnPlayNoteInput,
  onStopNoteInput: upOnStopNoteInput,
  accidentalWidthRatio = 0.65,
  pitchPositions = ({
    C: 0,
    Db: 0.55,
    D: 1,
    Eb: 1.8,
    E: 2,
    F: 3,
    Gb: 3.5,
    G: 4,
    Ab: 4.7,
    A: 5,
    Bb: 5.85,
    B: 6,
  }),
  children,

  noteRange,
}: KeyProps) => {
  const onPlayNoteInput = () => upOnPlayNoteInput(midiNumber);
  const onStopNoteInput = () => upOnStopNoteInput(midiNumber);

  // Key position is represented by the number of natural key widths from the left
  const getAbsoluteKeyPosition = (midiNumber: number) => {
    const OCTAVE_WIDTH = 7;
    const { octave, pitchName } = getAttributes(midiNumber);
    const pitchPosition = pitchPositions![pitchName];
    const octavePosition = OCTAVE_WIDTH * octave;
    return pitchPosition + octavePosition;
  };

  const getRelativeKeyPosition = (midiNumber: number) => {
    return (
      getAbsoluteKeyPosition(midiNumber) -
      getAbsoluteKeyPosition(noteRange.first)
    );
  };

  return (
    <div
      className={`ReactPiano__Key ${
        accidental ? "ReactPiano__Key--accidental" : "ReactPiano__Key--natural"
      } ${disabled ? "ReactPiano__Key--disabled" : ""} ${
        active ? "ReactPiano__Key--active" : ""
      }`}
      style={{
        left: ratioToPercentage(
          getRelativeKeyPosition(midiNumber) * naturalKeyWidth,
        ),
        width: ratioToPercentage(
          accidental ? accidentalWidthRatio * naturalKeyWidth : naturalKeyWidth,
        ),
      }}
      onMouseDown={useTouchEvents ? undefined : onPlayNoteInput}
      onMouseUp={useTouchEvents ? undefined : onStopNoteInput}
      onMouseEnter={gliss ? onPlayNoteInput : undefined}
      onMouseLeave={onStopNoteInput}
      onTouchStart={useTouchEvents ? onPlayNoteInput : undefined}
      onTouchCancel={useTouchEvents ? onStopNoteInput : undefined}
      onTouchEnd={useTouchEvents ? onStopNoteInput : undefined}
    >
      <div className="ReactPiano__NoteLabelContainer">{children}</div>
    </div>
  );
};

function ratioToPercentage(ratio: number) {
  return `${ratio * 100}%`;
}

export default Key;
