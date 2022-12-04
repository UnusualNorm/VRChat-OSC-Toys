import Head from 'next/head';
import styles from '../../styles/MidiAtar.module.css';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import ActorCursorManager from '../../components/CursorShare/Manager';
import Midi, { Event } from 'midi-player-js';
import MidiAtarKey from '../../components/MidiAtar/Key';

let socket: Socket;
let player: Midi.Player;
let strayNoteStops = new Array<number>();

const MidiAtar = () => {
  const [loadingMidi, setLoadingMidi] = useState(false);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);

  const socketInitializer = async () => {
    await fetch('/api/socket');
    socket = io('/MidiAtar');

    socket.on('connect', () => {
      console.log('Connected to MidiAtar socket!');
    });

    socket.on('startNote', (note: number) =>
      setActiveNotes((notes) => {
        const strayStopI = strayNoteStops.indexOf(note);
        if (strayStopI >= 0) {
          console.log(
            'ruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyi'
          );
          strayNoteStops.splice(strayStopI, 1);
          return;
        }

        notes.push(note);
        return [...notes];
      })
    );

    socket.on('stopNote', (note: number) =>
      setActiveNotes((notes) => {
        const noteI = notes.indexOf(note);
        if (noteI < 0) {
          console.log(
            'ruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyiruh rgfsdygfydgfagyigyi'
          );
          strayNoteStops.push(note);
          return;
        }

        notes.splice(noteI, 1);
        return [...notes];
      })
    );

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });
  };

  const onMidiChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files[0]) return;
    setLoadingMidi(true);

    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result;
      if (typeof arrayBuffer == 'string')
        player.loadDataUri(
          `data:text/plain;base64,${Buffer.from(arrayBuffer, 'base64')}`
        );
      else player.loadArrayBuffer(arrayBuffer);
      setLoadingMidi(false);
    };
    reader.readAsArrayBuffer(e.target.files[0]);
  };

  useEffect(() => {
    console.log(activeNotes);
  });

  useEffect(() => {
    socketInitializer();
    player = new Midi.Player((e: Event) => {
      switch (e.name) {
        case 'Note on': {
        }
        case 'Note off': {
        }
      }
    });
  }, []);

  return (
    <div>
      <Head>
        <title>MidiAtar</title>
      </Head>
      <button
        disabled={loadingMidi}
        onClick={() => {
          player.play();
        }}
      >
        Play
      </button>
      <button
        disabled={loadingMidi}
        onClick={() => {
          player.stop();
        }}
      >
        Stop
      </button>
      <input disabled={loadingMidi} type="file" onChange={onMidiChange} />
      <ActorCursorManager group="MidiAtar" />
      <ul className={styles.piano}>
        {(() => {
          const elements = new Array<ReturnType<typeof MidiAtarKey>>();
          for (let i = 0; i <= 23; i++)
            elements.push(
              <MidiAtarKey
                key={i}
                note={i}
                pressed={activeNotes.includes(i)}
                startNote={(note) => socket?.emit('startNote', note)}
                stopNote={(note) => socket?.emit('stopNote', note)}
              />
            );
          return elements;
        })()}
      </ul>
    </div>
  );
};

export default MidiAtar;
