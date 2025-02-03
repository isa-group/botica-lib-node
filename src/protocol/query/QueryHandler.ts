import { ResponsePacket } from "./ResponsePacket.js";
import { RequestPacket } from "./RequestPacket.js";
import * as crypto from "node:crypto";
import { PacketListener } from "../BoticaClient.js";

const REQUEST_ID_LENGTH = 8;

export class QueryHandler {
  readonly callbacks: {
    [requestId: string]: (response: ResponsePacket) => void;
  } = {};

  readonly timeouts: {
    [requestId: string]: NodeJS.Timeout;
  } = {};

  registerQuery<ResponsePacketT extends ResponsePacket>(
    packet: RequestPacket<ResponsePacketT>,
    callback: PacketListener<ResponsePacketT>,
    timeoutCallback: () => void,
    timeoutMs: number,
  ) {
    let requestId = crypto.randomBytes(REQUEST_ID_LENGTH / 2).toString("hex");
    packet.requestId = requestId;

    this.callbacks[requestId] = callback as (response: ResponsePacket) => void;
    this.timeouts[requestId] = setTimeout(timeoutCallback, timeoutMs);
  }

  acceptResponse(packet: ResponsePacket) {
    let requestId = packet.requestId;
    if (!requestId) {
      throw new Error("received %s packet with null request ID");
    }

    const callback = this.callbacks[requestId];
    if (!callback) return;

    const timeout = this.timeouts[requestId];
    if (timeout) clearTimeout(timeout);

    callback(packet);
  }
}
