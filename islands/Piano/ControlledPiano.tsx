import type { JSX } from "preact";
import type { NoteRange } from "../../types/piano.ts";
import { useEffect, useRef, useState } from "preact/hooks";
import { difference } from "../../utils/midi.ts";

import Keyboard from "./Keyboard.tsx";

interface ControlledPianoProps {
  noteRange: NoteRange;
  activeNotes: number[];
  playNote: (midiNumber: number) => void;
  stopNote: (midiNumber: number) => void;
  onPlayNoteInput: (midiNumber: number, activeNotes: number[]) => void;
  onStopNoteInput: (midiNumber: number, activeNotes: number[]) => void;
  renderNoteLabel?: (props: {
    isActive: boolean;
    isAccidental: boolean;
    midiNumber: number;
    keyboardShortcut: string | null;
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

const ControlledPiano = ({
  noteRange,
  activeNotes,
  playNote,
  stopNote,
  onPlayNoteInput: upOnPlayNoteInput,
  onStopNoteInput: upOnStopNoteInput,
  renderNoteLabel: upRenderNoteLabel = ((
    { keyboardShortcut, midiNumber, isActive, isAccidental },
  ) =>
    keyboardShortcut
      ? (
        <div
          className={`ReactPiano__NoteLabel ${
            isActive ? "ReactPiano__NoteLabel--active" : ""
          } ${
            isAccidental
              ? "ReactPiano__NoteLabel--accidental"
              : "ReactPiano__NoteLabel--natural"
          }`}
        >
          {keyboardShortcut}
        </div>
      )
      : null),
  className,
  disabled,
  width,
  keyWidthToHeight,
  keyboardShortcuts,
}: ControlledPianoProps) => {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [useTouchEvents, setUseTouchEvents] = useState(false);

  useEffect(() => {
    addEventListener("keydown", onKeyDown);
    addEventListener("keyup", onKeyUp);

    return () => {
      removeEventListener("keydown", onKeyDown);
      removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const prevActiveNotes = useRef<number[]>([]);
  useEffect(() => {
    handleNoteChanges({
      prevActiveNotes: prevActiveNotes.current,
      nextActiveNotes: activeNotes,
    });
    prevActiveNotes.current = activeNotes;
  }, [activeNotes]);

  // This function is responsible for diff'ing activeNotes
  // and playing or stopping notes accordingly.
  const handleNoteChanges = ({ prevActiveNotes, nextActiveNotes }: {
    prevActiveNotes: number[];
    nextActiveNotes: number[];
  }) => {
    if (disabled) {
      return;
    }
    const notesStopped = difference(prevActiveNotes, nextActiveNotes);
    const notesStarted = difference(nextActiveNotes, prevActiveNotes);
    notesStarted.forEach((midiNumber) => playNote(midiNumber));
    notesStopped.forEach((midiNumber) => stopNote(midiNumber));
  };

  const getMidiNumberForKey = (key: string) => {
    if (!keyboardShortcuts) {
      return null;
    }
    const shortcut = keyboardShortcuts.find((sh) => sh.key === key);
    return shortcut && shortcut.midiNumber;
  };

  const getKeyForMidiNumber = (midiNumber: number) => {
    if (!keyboardShortcuts) {
      return null;
    }
    const shortcut = keyboardShortcuts.find((sh) =>
      sh.midiNumber === midiNumber
    );
    return shortcut && shortcut.key;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    // Don't conflict with existing combinations like ctrl + t
    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    const midiNumber = getMidiNumberForKey(event.key);
    if (midiNumber) {
      onPlayNoteInput(midiNumber);
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    // This *should* also check for event.ctrlKey || event.metaKey || event.ShiftKey like onKeyDown does,
    // but at least on Mac Chrome, when mashing down many alphanumeric keystrokes at once,
    // ctrlKey is fired unexpectedly, which would cause onStopNote to NOT be fired, which causes problematic
    // lingering notes. Since it's fairly safe to call onStopNote even when not necessary,
    // the ctrl/meta/shift check is removed to fix that issue.
    const midiNumber = getMidiNumberForKey(event.key);
    if (midiNumber) {
      onStopNoteInput(midiNumber);
    }
  };

  const onPlayNoteInput = (midiNumber: number) => {
    if (disabled) {
      return;
    }
    // Pass in previous activeNotes for recording functionality
    upOnPlayNoteInput(midiNumber, activeNotes);
  };

  const onStopNoteInput = (midiNumber: number) => {
    if (disabled) {
      return;
    }
    // Pass in previous activeNotes for recording functionality
    upOnStopNoteInput(midiNumber, activeNotes);
  };

  const onMouseDown = () => setIsMouseDown(true);
  const onMouseUp = () => setIsMouseDown(false);
  const onTouchStart = () => setUseTouchEvents(true);

  const renderNoteLabel = ({ midiNumber, isActive, isAccidental }: {
    midiNumber: number;
    isActive: boolean;
    isAccidental: boolean;
  }) => {
    const keyboardShortcut = getKeyForMidiNumber(midiNumber) ?? null;
    return upRenderNoteLabel({
      keyboardShortcut,
      midiNumber,
      isActive,
      isAccidental,
    });
  };

  return (
    <div
      style={{ width: "100%", height: "100%" }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchStart={onTouchStart}
      data-testid="container"
    >
      <Keyboard
        noteRange={noteRange}
        onPlayNoteInput={onPlayNoteInput}
        onStopNoteInput={onStopNoteInput}
        activeNotes={activeNotes}
        className={className}
        disabled={disabled}
        width={width}
        keyWidthToHeight={keyWidthToHeight}
        gliss={isMouseDown}
        useTouchEvents={useTouchEvents}
        renderNoteLabel={renderNoteLabel}
      />
    </div>
  );
};

export default ControlledPiano;
