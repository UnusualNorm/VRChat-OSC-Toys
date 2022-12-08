import styles from "../../styles/MidiAtar.module.css";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import Midi from "midi-player-js";
import MidiAtarKey from ".//Key";
import { io, Socket } from "socket.io-client";

const MidiAtarPiano = () => {
  const [loadingMidi, setLoadingMidi] = useState(false);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);

  const socketRef = useRef<Socket>();
  const playerRef = useRef<Midi.Player>();
  const midiNotes = useRef<number[]>([]);
  const strayNoteStopsRef = useRef<number[]>([]);

  const handleSocketEvents = () => {
    socketRef.current.on("connect", () =>
      console.log("Connected to MidiAtar socket", socketRef.current.id)
    );
    socketRef.current.on("diconnect", (reason) =>
      console.log("Disconnected from MidiAtar socket", reason)
    );

    playerRef.current.on("endOfFile", () => {
      midiNotes.current.forEach((note) =>
        socketRef.current.emit("stopNote", note)
      );
      midiNotes.current = [];
    });

    socketRef.current.on("startNote", (note) => {
      setActiveNotes((notes) => {
        const strayStopI = strayNoteStopsRef.current.indexOf(note);
        if (strayStopI >= 0) {
          strayNoteStopsRef.current.splice(strayStopI, 1);
          return;
        }

        notes.push(note);
        return [...notes];
      });
    });

    socketRef.current.on("stopNote", (note) => {
      setActiveNotes((notes) => {
        const noteI = notes.indexOf(note);
        if (noteI < 0) {
          strayNoteStopsRef.current.push(note);
          return;
        }

        notes.splice(noteI, 1);
        return [...notes];
      });
    });
  };

  const handlePlayerEvents = (e: Midi.Event) => {
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
  };

  useEffect(() => {
    socketRef.current = io("/MidiAtar");

    playerRef.current = new Midi.Player(handlePlayerEvents);

    handleSocketEvents();

    navigator.requestMIDIAccess().then((midiAccess) => {
      console.log("Connected to Midi devices:", midiAccess.inputs.size);
      for (var input of midiAccess.inputs.values())
        input.onmidimessage = (msg: MIDIMessageEvent) => {
          const on = msg.data[0] == 144;
          console.log(`Note ${on ? "on" : "off"}:`, msg.data[1]);
          return socketRef.current.emit(
            `${on ? "start" : "stop"}Note`,
            msg.data[1]
          );
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

export default MidiAtarPiano;
