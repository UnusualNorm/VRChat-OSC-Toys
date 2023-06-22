// TODO: Add better logging, avatar banning, and client banning.

interface HostConfig {
  url: string;
  hostname: string;
  midiAtar: {
    enabled: boolean;
    baseNote: number;
    channels: number;
    duplicateNotes: boolean;
  };
}

let config: HostConfig = {
  url: "http://localhost:8000/host",
  hostname: "127.0.0.1",
  midiAtar: {
    enabled: true,
    baseNote: 84,
    channels: 8,
    duplicateNotes: false,
  },
};

type FullPartial<T> = {
  [P in keyof T]?: T[P] extends Record<string, unknown> ? FullPartial<T[P]>
    : T[P];
};

const applyFullPartial = <T>(obj: T, partial: FullPartial<T>): T => {
  for (const key in partial) {
    if (typeof partial[key] === "object") {
      obj[key] = applyFullPartial(obj[key], partial[key]!);
    } else {
      obj[key] = partial[key] as T[typeof key];
    }
  }
  return obj;
};

try {
  console.log("Loading config.json...");
  const customConfig = JSON.parse(
    Deno.readTextFileSync("./config.json"),
  ) as FullPartial<HostConfig>;
  config = applyFullPartial(config, customConfig);
  console.log("Loaded config.json!");
} catch (e) {
  console.error(`Failed to load config.json, using default config... (${e})`);
}

const disallowedAvatars = [];
if (!config.midiAtar.enabled) disallowedAvatars.push("midiAtar");

import io, { type Socket } from "socket.io-client";
import { EmitEvents, ListenEvents } from "./namespaces/host.ts";

import { Message, MessageType } from "osc";

// @ts-ignore VSCode doesn't think this function exists.
const conn = Deno.listenDatagram({ port: 9001, transport: "udp" });
const socket = io(config.url, {
  query: {
    disallowedAvatars: disallowedAvatars.join(","),
  },
  transports: ["websocket"],
}) as Socket<EmitEvents, ListenEvents>;

console.log("Connecting to server...");
socket.on("connect", () => console.log(`Connected to server! (${socket.id})`));
socket.on(
  "disconnect",
  (reason) => console.log(`Disconnected from server... (${reason})`),
);

socket.on(
  "clientConnected",
  (id, avatar) => console.log(`Client ${id} connected to ${avatar}!`),
);
socket.on(
  "clientDisconnected",
  (id) => console.log(`Client ${id} disconnected...`),
);

socket.on("param", (path, values, blame) => {
  const msg = new Message(path);

  for (const value of values) {
    msg.append(...value);
  }

  console.log((blame ? `${blame}: ` : "") + `${path} ${values}`);
  conn.send(msg.marshal(), {
    transport: "udp",
    port: 9000,
    hostname: config.hostname,
  });
});

const signAtarValues = " ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const signAtarLength = 8;
const signAtarChannels = Array(signAtarLength).fill(0);

socket.on("signAtarI", (dial, value, blame) => {
  if (dial < 0 || dial >= signAtarLength) return;
  if (value < 0 || value >= signAtarValues.length) return;

  signAtarChannels[dial] = value;

  const prog = value / (signAtarValues.length - 1);
  const msg = new Message(`/avatar/parameters/sign${dial}`);
  msg.append(prog, MessageType.Float32);

  console.log(
    (blame ? `${blame}: ` : "") +
      `signAtar ${dial} ${value} ${signAtarValues[value]} ${prog}`,
  );
  conn.send(msg.marshal(), {
    transport: "udp",
    port: 9000,
    hostname: config.hostname,
  });
});

socket.on("signAtarIDR", (cb) => {
  cb(signAtarChannels);
});

const midiAtarBaseNote = 84;
const midiAtarCalculateNoteVal = (note: number) =>
  Math.pow(2, (note - midiAtarBaseNote) / 12) / 3;
const midiAtarNoteChannels = 8;
const midiAtarUserNotes = new Map<string, [note: number, start: number][]>();
const midiAtarMaxTime = 5000;

let midiAtarCurrentNoteValues: number[] = [];

const midiAtarResendNotes = () => {
  const notes = Array.from(midiAtarUserNotes.values()).flat();
  const now = Date.now();
  const filteredNotes = notes.filter(([, start]) =>
    now - start <= midiAtarMaxTime
  );
  const uniqueNotes = Array.from(new Set(filteredNotes.map(([note]) => note)));
  const firstNotes = uniqueNotes.slice(0, midiAtarNoteChannels);
  const noteValues = firstNotes.map(midiAtarCalculateNoteVal);

  noteValues.forEach((note, i) => {
    if (note === midiAtarCurrentNoteValues[i]) return;
    const msg = new Message(`/avatar/parameters/note${i}`);
    msg.append(note, MessageType.Float32);

    conn.send(msg.marshal(), {
      transport: "udp",
      port: 9000,
      hostname: config.hostname,
    });
  });

  midiAtarCurrentNoteValues = noteValues;
};

socket.on("midiAtarKey", (key, pressed, blame) => {
  // Please never send midiatar notes as server, pretty please
  if (!blame) return;
  if (!midiAtarUserNotes.has(blame)) midiAtarUserNotes.set(blame, []);

  let notes = midiAtarUserNotes.get(blame)!;
  if (pressed) {
    notes.push([key, Date.now()]);
  } else {
    notes = notes.filter(([note]) => note !== key);
  }

  // dunno if this is needed
  midiAtarUserNotes.set(blame, notes);
  console.log(
    (blame ? `${blame}: ` : "") +
      `midiAtar ${key} ${pressed ? "pressed" : "released"}`,
  );
  midiAtarResendNotes();
});

socket.on("midiAtarClear", (blame) => {
  if (!blame) return;
  midiAtarUserNotes.set(blame, []);
  console.log((blame ? `${blame}: ` : "") + `midiAtar cleared`);
  midiAtarResendNotes();
});
