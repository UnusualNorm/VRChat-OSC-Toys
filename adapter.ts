const generateId = () => Math.floor(Math.random() * 1000000);

import {
  ClusterRequest,
  ClusterResponse,
} from "socket_io/packages/socket.io/lib/adapter.ts";
import { Adapter, type Namespace } from "socket_io/mod.ts";

export enum MessageType {
  Request = "request",
  Response = "response",
  KeepAlive = "keepAlive",
}

export interface Request {
  type: MessageType.Request;
  requesterUid: string;
  request: ClusterRequest;
  id: number;
  prevId: number;
}

export interface Response {
  type: MessageType.Response;
  requesterUid: string;
  responderUid: string;
  response: ClusterResponse;
  id: number;
  prevId: number;
}

export interface KeepAlive {
  type: MessageType.KeepAlive;
  uid: string;
}

export type Message = Request | Response | KeepAlive;

const KEEP_ALIVE_INTERVAL = 1000;
const KEEP_ALIVE_FORGIVENESS = 500;
export class BCAdapter extends Adapter {
  protected channel: BroadcastChannel;

  protected otherServers = new Map<string, number>();
  constructor(nsp: Namespace) {
    super(nsp);
    this.channel = new BroadcastChannel(nsp.name);

    this.channel.onmessage = (event: MessageEvent<Message>) =>
      this.onMessage(event.data);

    this.publishKeepAlive();
    setInterval(() => {
      this.publishKeepAlive();
      this.trimKeepAlive();
    }, KEEP_ALIVE_INTERVAL);
  }

  private heldMessages = new Map<string, Message[]>();
  protected onMessage(message: Message): void {
    switch (message.type) {
      case MessageType.Request: {
        // This condition should never be true, but it's here just in case.
        if (message.requesterUid === this.uid) return;
        if (
          this.previousRequestIds.has(message.requesterUid) &&
          this.previousRequestIds.get(message.requesterUid) !==
            message.prevId
        ) {
          this.heldMessages.set(message.requesterUid, [
            ...(this.heldMessages.get(message.requesterUid) || []),
            message,
          ]);
          return;
        }

        this.previousRequestIds.set(message.requesterUid, message.id);
        this.onRequest(message.request);
        this.reRunHeldMessages(message.requesterUid);
        break;
      }

      case MessageType.Response: {
        if (
          this.previousResponseIds.has(message.responderUid) &&
          this.previousResponseIds.get(message.responderUid) !==
            message.prevId
        ) {
          this.heldMessages.set(message.responderUid, [
            ...(this.heldMessages.get(message.responderUid) || []),
            message,
          ]);
          return;
        }

        this.previousResponseIds.set(message.responderUid, message.id);
        if (message.requesterUid !== this.uid) {
          this.reRunHeldMessages(message.responderUid);
          return;
        }

        this.onResponse(message.response);
        this.reRunHeldMessages(message.responderUid);
        break;
      }

      case MessageType.KeepAlive:
        if (message.uid === this.uid) return;
        this.otherServers.set(message.uid, Date.now());
    }
  }

  private reRunHeldMessages(uid: string): void {
    const heldMessages = this.heldMessages.get(uid);
    this.heldMessages.set(uid, []);
    heldMessages?.forEach((heldMessage) => {
      this.onMessage(heldMessage);
    });
  }

  // TODO: Make this actively fetch current servers instead of our cache
  public serverCount(): Promise<number> {
    this.trimKeepAlive();
    return Promise.resolve(this.otherServers.size + 1);
  }

  protected publishKeepAlive(): void {
    this.channel.postMessage({
      type: MessageType.KeepAlive,
      uid: this.uid,
    } as KeepAlive);
  }

  // Hopefully we don't need to sync requests and responses
  private previousRequestIds = new Map<string, number>();
  private previousResponseIds = new Map<string, number>();

  protected onServerConnected(_uid: string): void {
    // Do nothing
  }

  protected onServerDisconnected(uid: string): void {
    this.otherServers.delete(uid);
    this.heldMessages.delete(uid);
    this.previousRequestIds.delete(uid);
    this.previousResponseIds.delete(uid);
  }

  protected trimKeepAlive(): void {
    this.otherServers.forEach((lastSeen, uid) => {
      if (
        Date.now() - lastSeen > KEEP_ALIVE_INTERVAL + KEEP_ALIVE_FORGIVENESS
      ) {
        this.onServerDisconnected(uid);
      }
    });
  }

  private previousRequestId = 0;
  private previousResponseId = 0;

  protected publishRequest(request: ClusterRequest): void {
    const id = generateId();
    this.channel.postMessage(
      {
        type: MessageType.Request,
        request,
        requesterUid: this.uid,
        id,
        prevId: this.previousRequestId,
      } as Request,
    );
    this.previousRequestId = id;
  }

  protected publishResponse(
    requesterUid: string,
    response: ClusterResponse,
  ): void {
    const id = generateId();
    this.channel.postMessage({
      type: MessageType.Response,
      requesterUid,
      responderUid: this.uid,
      response,
      id,
      prevId: this.previousResponseId,
    } as Response);
    this.previousResponseId = id;
  }
}

export const createAdapter = () => (nsp: Namespace) => {
  return new BCAdapter(nsp);
};
