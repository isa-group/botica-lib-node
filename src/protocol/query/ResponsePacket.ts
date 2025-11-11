import { Packet } from "@/protocol/index.js";

export abstract class ResponsePacket extends Packet {
  constructor(public requestId?: string) {
    super();
  }
}
