import type { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { useEffect, useRef, useState } from "preact/hooks";
import { useSocket } from "../utils/socket.io.ts";
import MidiPlayer from "midi-player-js";
import { SplendidGrandPiano } from "https://esm.sh/smplr@0.6.1";

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
  noteRange = { first: 36, last: 84 },
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

  const socketRef = useSocket({
    query: {
      hostId: parseCookies(document.cookie).hostId,
      avatar: "midiatar",
    },
  });

  // We don't need to grab an idr frame, as music notes don't last for very long
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [userActiveNotes, setUserActiveNotes] = useState<number[]>([]);
  const [midiLoaded, setMidiLoaded] = useState(false);
  const [playingMidi, setPlayingMidi] = useState(false);
  const [hearAudio, setHearAudio] = useState(false);

  const playerRef = useRef<MidiPlayer.Player>();
  const contextRef = useRef<AudioContext | null>(null);
  const pianoRef = useRef<SplendidGrandPiano | null>(null);
  const hearAudioRef = useRef(hearAudio);

  useEffect(() => {
    hearAudioRef.current = hearAudio;
    if (!hearAudio) {
      return;
    }

    console.log("Setting up audio...");
    if (!contextRef.current) contextRef.current = new AudioContext();
    else contextRef.current.resume();

    if (!pianoRef.current) {
      pianoRef.current = new SplendidGrandPiano(contextRef.current);
    }

    return () => {
      console.log("Closing audio...");
      contextRef.current?.suspend();
    };
  }, [hearAudio]);

  useEffect(() => {
    console.log("Setting up socket...");
    if (!socketRef.current) {
      return;
    }

    socketRef.current.on("midiAtarKey", (key: number, pressed: boolean) => {
      setActiveNotes((activeNotes) => {
        if (pressed) {
          // Don't append note to activeNotes if it's already present
          if (activeNotes.includes(key)) {
            return activeNotes;
          }

          if (hearAudioRef.current) pianoRef.current?.start(key);
          return activeNotes.concat(key);
        } else {
          if (!activeNotes.includes(key)) {
            return activeNotes;
          }

          pianoRef.current?.stop(key);
          return activeNotes.filter((note) => key !== note);
        }
      });
    });

    return () => {
      console.log("Cleaning up socket...");
      socketRef.current?.off("midiAtarKey");
    };
  }, [socketRef.current]);

  const handlePlayNoteInput = (midiNumber: number) => {
    console.log(`Playing note ${midiNumber}...`);
    setUserActiveNotes((userActiveNotes) => {
      if (userActiveNotes.includes(midiNumber)) {
        return userActiveNotes;
      }

      socketRef.current?.emit("midiAtarKey", midiNumber, true);
      // Use the ref because the midi player will call this function
      if (hearAudioRef.current) {
        pianoRef.current?.start(midiNumber);
      }

      return userActiveNotes.concat(midiNumber);
    });
  };

  const handleStopNoteInput = (midiNumber: number) => {
    console.log(`Stopping note ${midiNumber}...`);
    setUserActiveNotes((useractiveNotes) => {
      if (useractiveNotes.includes(midiNumber)) {
        socketRef.current?.emit("midiAtarKey", midiNumber, false);
        pianoRef.current?.stop(midiNumber);
      }

      return useractiveNotes.filter((note) => midiNumber !== note);
    });
  };

  useEffect(() => {
    console.log("Setting up midi input...");
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

  useEffect(() => {
    console.log("Setting up midi player...");
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

    playerRef.current.on("endOfFile", () => {
      console.log("MIDI file ended!");
      stopMidi();
    });

    playerRef.current.on("fileLoaded", () => {
      console.log("MIDI file loaded!");
      setMidiLoaded(true);
    });
  }, []);

  const resetUserActiveNotes = () => {
    console.log("Resetting user active notes...");
    setUserActiveNotes((useractiveNotes) => {
      useractiveNotes.forEach((note) => {
        socketRef.current?.emit("midiAtarKey", note, false);
        pianoRef.current?.stop(note);
      });
      return [];
    });
  };

  const stopMidi = () => {
    console.log("Stopping MIDI...");
    playerRef.current?.stop();
    resetUserActiveNotes();
  };

  const startMidi = () => {
    console.log("Starting MIDI...");
    playerRef.current?.play();
  };

  return (
    <div class="flex flex-col items-center justify-center w-full max-w-md p-4">
      <div class="flex flex-row items-center justify-center w-full">
        <Input
          type="file"
          accept=".mid"
          disabled={playingMidi}
          onChange={(e) => {
            setMidiLoaded(false);
            if (!e.currentTarget.files || e.currentTarget.files.length === 0) {
              console.warn("No file selected...");
              return;
            }

            const file = e.currentTarget.files[0];
            console.log(`Reading ${file.name}...`);
            const reader = new FileReader();
            reader.onload = () => {
              if (!reader.result) {
                console.error(`Failed to read ${file.name}...`);
                return;
              }

              if (!playerRef.current) {
                console.error(`Failed to load ${file.name}, no player...`);
                return;
              }

              if (reader.result instanceof ArrayBuffer) {
                console.log(
                  `Read ${file.name} as ArrayBuffer! Loading...`,
                );
                playerRef.current.loadArrayBuffer(reader.result);
              } else {
                console.log(
                  `Read ${file.name} as string! Loading...`,
                );
                const uri = "data:audio/midi;base64," + btoa(reader.result);
                playerRef.current.loadDataUri(uri);
              }
            };

            reader.readAsArrayBuffer(file);
          }}
        />
        <Button
          onClick={() => {
            setPlayingMidi(!playingMidi);
            if (playingMidi) {
              stopMidi();
            } else {
              startMidi();
            }
          }}
          disabled={!midiLoaded}
          className="m-2"
        >
          {playingMidi ? "Stop" : "Play"}
        </Button>
        <Input
          type="checkbox"
          checked={hearAudio}
          onChange={(e) => {
            setHearAudio(e.currentTarget.checked);
          }}
        />
        <p>Listen</p>
      </div>
      {/* <div class="flex flex-col items-center justify-center w-full"> */}
      <ControlledPiano
        activeNotes={activeNotes.concat(userActiveNotes)}
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
      {/* </div> */}
    </div>
  );
};

export default MidiAtar;
