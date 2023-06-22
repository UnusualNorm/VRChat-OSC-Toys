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
  noteRange?: NoteRange;
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

  // We don't need to grab an idr frame, as music notes don't last for very long
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [useractiveNotes, setUserActiveNotes] = useState<number[]>([]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on("midiAtarKey", (key: number, pressed: boolean) => {
      setActiveNotes((activeNotes) => {
        if (pressed) {
          // Don't append note to activeNotes if it's already present
          if (activeNotes.includes(key)) {
            return activeNotes;
          }

          return activeNotes.concat(key);
        } else {
          return activeNotes.filter((note) => key !== note);
        }
      });
    });
  }, [socket]);

  const handlePlayNoteInput = (midiNumber: number) =>
    setUserActiveNotes((useractiveNotes) => {
      // Don't append note to activeNotes if it's already present
      if (useractiveNotes.includes(midiNumber)) {
        return useractiveNotes;
      } else {
        socket?.emit("midiAtarKey", midiNumber, true);
      }

      return useractiveNotes.concat(midiNumber);
    });

  const handleStopNoteInput = (midiNumber: number) =>
    setUserActiveNotes((useractiveNotes) => {
      if (useractiveNotes.includes(midiNumber)) {
        socket?.emit("midiAtarKey", midiNumber, false);
      }

      return useractiveNotes.filter((note) => midiNumber !== note);
    });

  return (
    <ControlledPiano
      activeNotes={activeNotes.concat(useractiveNotes)}
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
