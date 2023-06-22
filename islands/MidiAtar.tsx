import type { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { useEffect, useRef, useState } from "preact/hooks";
import { useSocket } from "../utils/socket.io.ts";
import MidiPlayer from "midi-player-js";

import Input from "./Input.tsx";
import Button from "./Button.tsx";
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
  const [uploadingMidi, setUploadingMidi] = useState(false);
  const [playingMidi, setPlayingMidi] = useState(false);
  const playerRef = useRef<any>();

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

  useEffect(() => {
    // Setup midi input
    if (!navigator.requestMIDIAccess) {
      return;
    }

    navigator.requestMIDIAccess().then((midiAccess) => {
      const inputs = midiAccess.inputs.values();

      for (const input of inputs) {
        // @ts-ignore onmidimessage is not correct in the typescript definition
        input.onmidimessage = ({ data }: MIDIMessageEvent) => {
          const [command, note] = data;

          if (command === 144) {
            handlePlayNoteInput(note);
          } else if (command === 128) {
            handleStopNoteInput(note);
          }
        };
      }
    });
  }, []);

  return (
    <div class="flex flex-col items-center justify-center w-full max-w-md p-4">
      <div class="flex flex-row items-center justify-center w-full">
        <Input
          type="file"
          accept=".mid"
          disabled={uploadingMidi}
          onChange={(e) => {
            playerRef.current?.stop();
            if (!e.target) {
              return;
            }

            setUploadingMidi(true);
            const reader = new FileReader();
            reader.onload = (e) => {
              playerRef.current = new MidiPlayer.Player(
                (
                  event: { name: string; velocity: number; noteNumber: number },
                ) => {
                  // Note that because of a common practice called "running status" many MIDI files may use Note on events with 0 velocity in place of Note off events.
                  if (event.name === "Note on" && event.velocity === 0) {
                    event.name = "Note off";
                  }

                  if (event.name === "Note on") {
                    handlePlayNoteInput(event.noteNumber);
                  } else if (event.name === "Note off") {
                    handleStopNoteInput(event.noteNumber);
                  }
                },
              );
              playerRef.current.loadArrayBuffer(reader.result as ArrayBuffer);
              setUploadingMidi(false);
            };

            // @ts-ignore target is not correct in the typescript definition
            reader.readAsArrayBuffer((e.target).files[0]);
          }}
        />
        <Button
          onClick={() => {
            setPlayingMidi(!playingMidi);
            if (playingMidi) {
              playerRef.current?.stop();
              useractiveNotes.forEach((note) => {
                socket?.emit("midiAtarKey", note, false);
              });
              setUserActiveNotes([]);
            } else {
              playerRef.current?.play();
            }
          }}
          disabled={uploadingMidi}
          className="m-2"
        >
          {playingMidi ? "Stop" : "Play"}
        </Button>
      </div>
      <div class="flex flex-row items-center justify-center w-full">
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
      </div>
    </div>
  );
};

export default MidiAtar;
