import { Packet } from "../index.js";

export class ReadyPacket extends Packet {
  readonly type = "ready";
}
