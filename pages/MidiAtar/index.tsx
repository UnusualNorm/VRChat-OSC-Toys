import Head from "next/head";
import styles from "../../styles/MidiAtar.module.css";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import ActorCursorManager from "../../components/CursorShare/Manager";
import Midi from "midi-player-js";
import MidiAtarKey from "../../components/MidiAtar/Key";
import { io, Socket } from "socket.io-client";

let player: Midi.Player;
let strayNoteStops: number[] = [];

const MidiAtar = () => {
  const [loadingMidi, setLoadingMidi] = useState(false);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const socketRef = useRef<Socket>();
  const playerRef = useRef<Midi.Player>();
  const midiNotes = useRef<number[]>([]);

  useEffect(() => {
    if (!socketRef.current) socketRef.current = io("/MidiAtar");
    const socket = socketRef.current;

    socket.on("connect", () =>
      console.log("Connected to MidiAtar socket", socket.id)
    );
    socket.on("diconnect", (reason) =>
      console.log("Disconnected from MidiAtar socket", reason)
    );

    playerRef.current = new Midi.Player((e: Midi.Event) => {
      switch (e.name) {
        case "Note on": {
          if (e.velocity == 0) {
            console.log("Note off:", e.noteNumber);
            midiNotes.current.splice(midiNotes.current.indexOf(e.noteNumber));
            socketRef.current.emit("stopNote", e.noteNumber);
            return;
          }

          console.log("Note on:", e.noteNumber);
          midiNotes.current.push(e.noteNumber);
          socketRef.current.emit("startNote", e.noteNumber);
          break;
        }
        case "Note off": {
          console.log("Note off:", e.noteNumber);
          midiNotes.current.splice(midiNotes.current.indexOf(e.noteNumber));
          socketRef.current.emit("stopNote", e.noteNumber);
          break;
        }
      }
    });

    playerRef.current.on("endOfFile", () => {
      midiNotes.current.forEach((note) =>
        socketRef.current.emit("stopNote", note)
      );
      midiNotes.current = [];
    });

    socket.on("startNote", (note) => {
      setActiveNotes((notes) => {
        const strayStopI = strayNoteStops.indexOf(note);
        if (strayStopI >= 0) {
          strayNoteStops.splice(strayStopI, 1);
          return;
        }

        notes.push(note);
        return [...notes];
      });
    });

    socket.on("stopNote", (note) => {
      setActiveNotes((notes) => {
        const noteI = notes.indexOf(note);
        if (noteI < 0) {
          strayNoteStops.push(note);
          return;
        }

        notes.splice(noteI, 1);
        return [...notes];
      });
    });

    // @ts-ignore Bruh, it does exist, stop lying to me
    navigator.requestMIDIAccess().then((midiAccess) => {
      console.log("Connected to Midi devices:", midiAccess.inputs.size);
      for (var input of midiAccess.inputs.values())
        input.onmidimessage = (msg) => {
          const on = msg.data[0] == 144;
          console.log(`Note ${on ? "on" : "off"}:`, msg.data[1]);
          return socket.emit(`${on ? "start" : "stop"}Note`, msg.data[1]);
        };
    });
  }, []);

  const onMidiChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files[0]) return;
    setLoadingMidi(true);

    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result;
      if (typeof arrayBuffer == "string")
        playerRef.current.loadDataUri(
          `data:text/plain;base64,${Buffer.from(arrayBuffer, "base64")}`
        );
      else playerRef.current.loadArrayBuffer(arrayBuffer);
      setLoadingMidi(false);
    };
    reader.readAsArrayBuffer(e.target.files[0]);
  };

  const onPressed = (note: number) => socketRef.current.emit("startNote", note);
  const onReleased = (note: number) => socketRef.current.emit("stopNote", note);

  return (
    <div>
      <Head>
        <title>MidiAtar</title>
      </Head>
      <button disabled={loadingMidi} onClick={() => playerRef.current.play()}>
        Play
      </button>
      <button
        disabled={loadingMidi}
        onClick={() => {
          playerRef.current.stop();
          midiNotes.current.forEach((note) =>
            socketRef.current.emit("stopNote", note)
          );
          midiNotes.current = [];
        }}
      >
        Stop
      </button>
      <input disabled={loadingMidi} type="file" onChange={onMidiChange} />
      <ActorCursorManager group="MidiAtar" />
      <ul className={styles.piano}>
        {(() => {
          const elements = new Array<ReturnType<typeof MidiAtarKey>>();
          for (let i = 0; i <= 23; i++) {
            const note = i + 41;
            elements.push(
              <MidiAtarKey
                key={i}
                note={note}
                pressed={activeNotes.includes(note)}
                onPressed={() => onPressed(note)}
                onReleased={() => onReleased(note)}
              />
            );
          }
          return elements;
        })()}
      </ul>
      <ul className={styles.piano}>
        {(() => {
          const elements = new Array<ReturnType<typeof MidiAtarKey>>();
          for (let i = 0; i <= 23; i++) {
            const note = i + 24 + 41;
            elements.push(
              <MidiAtarKey
                key={i}
                note={note}
                pressed={activeNotes.includes(note)}
                onPressed={() => onPressed(note)}
                onReleased={() => onReleased(note)}
              />
            );
          }
          return elements;
        })()}
      </ul>
    </div>
  );
};

export default MidiAtar;
