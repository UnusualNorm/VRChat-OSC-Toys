import {
  ClusterRequest,
  ClusterResponse,
} from "socket_io/packages/socket.io/lib/adapter.ts";
import { Adapter, type Namespace } from "socket_io/mod.ts";

export enum MessageType {
  Request = "request",
  Response = "response",
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

export type Message = Request | Response;

export class BCAdapter extends Adapter {
  protected channel: BroadcastChannel;

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
      }
    };
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
