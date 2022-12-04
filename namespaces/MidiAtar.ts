import { Server } from 'socket.io';
import { Client } from 'node-osc';

let client: Client;
try {
  client = new Client('127.0.0.1', 9000);
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

  async play(note: number) {
    await this.currentOperation;
    const strayNoteStopI = strayNoteStops.indexOf(note);
    if (strayNoteStopI >= 0) return strayNoteStops.splice(strayNoteStopI, 1);
    this.currentOperation = setParameter(this.channel, calculateNoteVal(note));

    await this.currentOperation;
    this.startTime = Date.now();
    this.playing = true;
    this.currentNote = note;
  }

  async stop() {
    await this.currentOperation;
    this.currentOperation = setParameter(this.channel, 0);

    await this.currentOperation;
    this.playing = false;
    this.currentNote = 0;
  }
}

const channels = (function () {
  const arr = [];
  for (let i = 0; i < noteChannels; i++) arr.push(new NoteChannel(i + 1));
  return arr;
})();

const midiAtarHandler = (io: Server) => {
  const MidiAtar = io.of('/MidiAtar');

  class NoteManager {
    constructor(channels: NoteChannel[]) {
      this.channels = channels;
    }

    channels: NoteChannel[];
    playingNotes = new Array<number>();
    strayNoteStops = new Array<number>();

    async playNote(note: number) {
      // Check to see if this has already been stopped
      const strayNoteI = this.strayNoteStops.indexOf(note);
      if (strayNoteI >= 0) return this.strayNoteStops.splice(strayNoteI, 1);

      // Check if there's an available channel
      let channel = await findAsync(this.channels, async (channel) => {
        await channel.currentOperation;
        return !channel.playing;
      });

      if (!channel) {
        console.warn(
          'MidiAtar: Not enough channels, overwriting oldest note...'
        );
        channel = await reduceAsync(
          this.channels,
          async (a, b) => {
            await a.currentOperation;
            await b.currentOperation;
            return a.startTime < b.startTime ? a : b;
          },
          this.channels[0]
        );
        console.log(channel);
        overwrittenNotes.push(channel.currentNote);
      }

      this.playingNotes.push(note);
      MidiAtar.emit('startNote', note);
      await channel.play(note);
    }

    async stopNote(note: number) {
      if (this.playingNotes.indexOf(note) < 0) {
        console.warn('MidiAtar: Note stop requested, but no note was found...');
        return this.strayNoteStops.push(note);
      }

      let channel = await findAsync(this.channels, async (channel) => {
        await channel.currentOperation;
        return channel.playing && channel.currentNote == note;
      });

      if (!channel) {
        // Check if our note has been overwritten
        const overwrittenNoteI = overwrittenNotes.indexOf(note);
        if (overwrittenNoteI >= 0)
          return overwrittenNotes.splice(overwrittenNoteI, 1);
        // Huh? How did we get here?
        console.error(
          'MidiAtar: Algorithm-breaking bug just occured, this is not good...'
        );
        return;
      }

      MidiAtar.emit('stopNote', note);
      await channel.stop();
    }
  }

  MidiAtar.on('connection', (socket) => {
    console.log('MidiAtar: Player connected:', socket.id);

    const noteManager = new NoteManager(channels);
    socket.on('startNote', (noteNumber: number) => {
      console.log('MidiAtar: Player started note:', noteNumber);
      noteManager.playNote(noteNumber);
    });

    socket.on('stopNote', (noteNumber: number) => {
      console.log('MidiAtar: Player stopped note:', noteNumber);
      noteManager.stopNote(noteNumber);
    });

    socket.on('disconnect', () => {
      console.log('MidiAtar: Player disconnected:', socket.id);
      noteManager.playingNotes.forEach((note) => noteManager.stopNote(note));
      // Holy crud, garbage collector, don't fail on me please
    });
  });
};

export default midiAtarHandler;
