import { Server } from "socket.io";
import { Client } from "node-osc";

let client: Client;
try {
  client = new Client("127.0.0.1", 9000);
} catch (e) {
  // Looks like we're (probably) in stackblitz or smth...
}

const setParameter = (param: string | number, value: string | number) =>
  new Promise<void>((resolve, reject) =>
    client
      ? client.send(
          {
            address: `/avatar/parameters/${param}`,
            args: [value],
          },
          (err) => {
            if (err) reject(err);
            resolve();
          }
        )
      : resolve()
  );

// --------------------
// ----- MIDIATAR -----
// --------------------

const findAsync = async <T>(
  list: T[],
  predicate: (item: T) => boolean | Promise<boolean>
): Promise<T> => {
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!(await predicate(item))) continue;
    return item;
  }
};

const reduceAsync = async <T>(
  list: T[],
  callback: (accumulator: T, item: T) => T | Promise<T>,
  initialValue: T
): Promise<T> => {
  let accumulator = initialValue;
  for (let i = 0; i < list.length; i++) {
    if (accumulator) accumulator = await callback(accumulator, list[i]);
    else accumulator = list[i];
  }

  return accumulator;
};

const baseNote = 84;
const calculateNoteVal = (note) => Math.pow(2, (note - baseNote) / 12) / 3;
const strayNoteStops = [];
const overwrittenNotes = [];
const noteChannels = 8;

class NoteChannel {
  constructor(channel: number) {
    this.channel = channel;
  }

  channel = 0;
  playing = false;
  currentNote = 0;
  startTime = 0;

  currentOperation = new Promise<void>((res) => res());

  async play(note: number): Promise<void> {
    this.startTime = Date.now();
    this.playing = true;
    this.currentNote = note;
    await this.currentOperation;

    const strayNoteStopI = strayNoteStops.indexOf(note);
    if (strayNoteStopI >= 0) {
      strayNoteStops.splice(strayNoteStopI, 1);
      return;
    }

    this.currentOperation = setParameter(this.channel, calculateNoteVal(note));
    return this.currentOperation;
  }

  async stop() {
    this.playing = false;
    this.currentNote = 0;
    await this.currentOperation;

    this.currentOperation = setParameter(this.channel, 0);
    return this.currentOperation;
  }
}

const channels = (function () {
  const arr = [];
  for (let i = 0; i < noteChannels; i++) arr.push(new NoteChannel(i + 1));
  return arr;
})();

const midiAtarHandler = (io: Server) => {
  const MidiAtar = io.of("/MidiAtar");
  MidiAtar.on("connection", (socket) => {
    console.log("MidiAtar: Player connected:", socket.id);
    const playingNotes: number[] = [];
    const strayNoteStops: number[] = [];
    const skippedNotes: number[] = [];

    socket.on("startNote", (note: number) => {
      // Check to see if this has already been stopped
      const strayNoteI = strayNoteStops.indexOf(note);
      if (strayNoteI >= 0) return strayNoteStops.splice(strayNoteI, 1);

      // Check if there's an available channel
      let channel = channels.find((channel) => !channel.playing);

      if (!channel) {
        // Stuff get's kind of hectic here... Let's just not touch this for now...
        console.warn(
          "MidiAtar: Not enough channels skipping note:",
          socket.id,
          note
        );
        return skippedNotes.push(note);

        // console.warn(
        //   "MidiAtar: Not enough channels, overwriting oldest note..."
        // );
        // channel = await reduceAsync(
        //   channels,
        //   async (a, b) => {
        //     await a.currentOperation;
        //     await b.currentOperation;
        //     return a.startTime < b.startTime ? a : b;
        //   },
        //   channels[0]
        // );
        // console.log(channel);
        // overwrittenNotes.push(channel.currentNote);
      }

      playingNotes.push(note);
      MidiAtar.emit("startNote", note);
      channel.play(note);
    });

    const stopNote = (note: number) => {
      if (playingNotes.indexOf(note) < 0) {
        console.warn(
          "MidiAtar: Note stop requested, but no note was found:",
          socket.id,
          note
        );
        return strayNoteStops.push(note);
      }

      let channel = channels.find(
        (channel) => channel.playing && channel.currentNote == note
      );

      if (!channel) {
        // Check if our note has been overwritten
        const overwrittenNoteI = overwrittenNotes.indexOf(note);
        if (overwrittenNoteI >= 0)
          return overwrittenNotes.splice(overwrittenNoteI, 1);

        const skippedNoteI = skippedNotes.indexOf(note);
        if (skippedNoteI >= 0) return skippedNotes.splice(skippedNoteI, 1);

        // Huh? How did we get here?
        console.error(
          "MidiAtar: Algorithm-breaking bug just occured, this is not good:",
          socket.id,
          note,
          playingNotes,
          strayNoteStops,
          skippedNotes
        );
        return;
      }

      MidiAtar.emit("stopNote", note);
      channel.stop();
    };

    socket.on("stopNote", stopNote);

    socket.on("disconnect", () => {
      console.log("MidiAtar: Player disconnected:", socket.id);
      playingNotes.forEach(stopNote);
    });
  });
};

export default midiAtarHandler;
