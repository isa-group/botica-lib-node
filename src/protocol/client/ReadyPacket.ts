import { Packet } from "@/protocol/index.js";

export class ReadyPacket extends Packet {
  readonly type = "ready";
}
