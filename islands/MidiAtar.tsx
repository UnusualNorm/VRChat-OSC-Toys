import type { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { useEffect, useState } from "preact/hooks";
import { useSocket } from "../utils/socket.io.ts";

import ControlledPiano from "./Piano/ControlledPiano.tsx";
import { NoteRange } from "../types/piano.ts";

const parseCookies = (cookie: string) => {
  const out: Record<string, string> = {};
  const c = cookie.split(";");

  for (const kv of c) {
    const [cookieKey, ...cookieVal] = kv.split("=");
    const key = cookieKey.trim();
    out[key] = cookieVal.join("=");
  }

  return out;
};

interface MidiAtarProps {
  noteRange: NoteRange;
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

/*
<Piano
            noteRange={{ first: 48, last: 72 }}
            playNote={(midiNumber) => console.log("playNote", midiNumber)}
            stopNote={(midiNumber) => console.log("stopNote", midiNumber)}
            width={600}
          />
          */

const MidiAtar = ({
  noteRange = { first: 48, last: 72 },
  renderNoteLabel,
  className,
  disabled,
  width = 600,
  keyWidthToHeight,
  keyboardShortcuts,
}: MidiAtarProps) => {
  if (!IS_BROWSER) {
    return (
      <div>
        <p>Please enable Javascript.</p>
      </div>
    );
  }

  const socket = useSocket({
    query: {
      hostId: parseCookies(document.cookie).hostId,
      avatar: "midiatar",
    },
  });

  useEffect(() => {
  }, [socket]);

  // We don't need to grab an idr frame, as music notes don't last for very long
  const [activeNotes, setActiveNotes] = useState<number[]>([]);

  const handlePlayNoteInput = (midiNumber: number) =>
    setActiveNotes((activeNotes) => {
      // Don't append note to activeNotes if it's already present
      if (activeNotes.includes(midiNumber)) {
        return activeNotes;
      }

      return activeNotes.concat(midiNumber);
    });

  const handleStopNoteInput = (midiNumber: number) =>
    setActiveNotes((activeNotes) =>
      activeNotes.filter((note) => midiNumber !== note)
    );

  return (
    <ControlledPiano
      activeNotes={activeNotes}
      onPlayNoteInput={handlePlayNoteInput}
      onStopNoteInput={handleStopNoteInput}
      noteRange={noteRange}
      playNote={() => {}}
      stopNote={() => {}}
      renderNoteLabel={renderNoteLabel}
      className={className}
      disabled={disabled}
      width={width}
      keyWidthToHeight={keyWidthToHeight}
      keyboardShortcuts={keyboardShortcuts}
    />
  );
};

export default MidiAtar;
