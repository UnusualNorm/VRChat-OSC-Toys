import type { NoteRange } from "../../types/piano.ts";
import type { JSX } from "preact";
import { useEffect, useState } from "preact/hooks";

import ControlledPiano from "./ControlledPiano.tsx";

interface PianoProps {
  noteRange: NoteRange;
  activeNotes?: number[];
  playNote: (midiNumber: number) => void;
  stopNote: (midiNumber: number) => void;
  onPlayNoteInput?: (midiNumber: number, prevActiveNotes: number[]) => void;
  onStopNoteInput?: (midiNumber: number, prevActiveNotes: number[]) => void;
  renderNoteLabel?: (props: {
    isActive: boolean;
    isAccidental: boolean;
    midiNumber: number;
  }) => JSX.Element | null;
  className?: string;
  disabled?: boolean;
  width?: number;
  keyWidthToHeight?: number;
  keyboardShortcuts?: {
    key: string;
    midiNumber: number;
  }[];
}

const Piano = ({
  noteRange,
  activeNotes: upActiveNotes,
  playNote,
  stopNote,
  onPlayNoteInput,
  onStopNoteInput,
  renderNoteLabel,
  className,
  disabled,
  width,
  keyWidthToHeight,
  keyboardShortcuts,
}: PianoProps) => {
  const [activeNotes, setActiveNotes] = useState(upActiveNotes ?? []);

  useEffect(() => {
    // Make activeNotes "controllable" by using internal
    // state by default, but allowing prop overrides.
    if (
      activeNotes === upActiveNotes
    ) return;

    setActiveNotes(upActiveNotes || []);
  }, [upActiveNotes]);

  const handlePlayNoteInput = (midiNumber: number) =>
    setActiveNotes((activeNotes) => {
      // Need to be handled inside setState in order to set prevActiveNotes without
      // race conditions.
      if (onPlayNoteInput) {
        onPlayNoteInput(midiNumber, activeNotes);
      }

      // Don't append note to activeNotes if it's already present
      if (activeNotes.includes(midiNumber)) {
        return activeNotes;
      }

      return activeNotes.concat(midiNumber);
    });

  const handleStopNoteInput = (midiNumber: number) =>
    setActiveNotes((activeNotes) => {
      // Need to be handled inside setState in order to set prevActiveNotes without
      // race conditions.
      if (onStopNoteInput) {
        onStopNoteInput(midiNumber, activeNotes);
      }

      return activeNotes.filter((note) => midiNumber !== note);
    });

  return (
    <ControlledPiano
      activeNotes={activeNotes}
      onPlayNoteInput={handlePlayNoteInput}
      onStopNoteInput={handleStopNoteInput}
      noteRange={noteRange}
      playNote={playNote}
      stopNote={stopNote}
      renderNoteLabel={renderNoteLabel}
      className={className}
      disabled={disabled}
      width={width}
      keyWidthToHeight={keyWidthToHeight}
      keyboardShortcuts={keyboardShortcuts}
    />
  );
};

export default Piano;
