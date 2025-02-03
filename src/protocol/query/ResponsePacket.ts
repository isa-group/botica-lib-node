import { Packet } from "../index.js";

export abstract class ResponsePacket extends Packet {
  protected constructor(public requestId?: string) {
    super();
  }
}
