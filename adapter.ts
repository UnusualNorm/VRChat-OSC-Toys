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
  request: ClusterRequest;
}

export interface Response {
  type: MessageType.Response;
  requesterUid: string;
  response: ClusterResponse;
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

    this.channel.onmessage = (event: MessageEvent<Message>) => {
      switch (event.data.type) {
        case MessageType.Request:
          // This condition should never be true, but it's here just in case.
          if (event.data.request.uid === this.uid) return;
          this.onRequest(event.data.request);
          break;

        case MessageType.Response:
          if (event.data.requesterUid !== this.uid) return;
          this.onResponse(event.data.response);
          break;

        case MessageType.KeepAlive:
          if (event.data.uid === this.uid) return;
          this.otherServers.set(event.data.uid, Date.now());
      }
    };

    this.publishKeepAlive();
    setInterval(() => {
      this.publishKeepAlive();
      this.trimKeepAlive();
    }, KEEP_ALIVE_INTERVAL);
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

  protected trimKeepAlive(): void {
    this.otherServers.forEach((lastSeen, uid) => {
      if (
        Date.now() - lastSeen > KEEP_ALIVE_INTERVAL + KEEP_ALIVE_FORGIVENESS
      ) {
        this.otherServers.delete(uid);
      }
    });
  }

  protected publishRequest(request: ClusterRequest): void {
    this.channel.postMessage({ type: MessageType.Request, request } as Request);
  }

  protected publishResponse(
    requesterUid: string,
    response: ClusterResponse,
  ): void {
    this.channel.postMessage({
      type: MessageType.Response,
      requesterUid,
      response,
    } as Response);
  }
}

export const createAdapter = () => (nsp: Namespace) => {
  return new BCAdapter(nsp);
};
