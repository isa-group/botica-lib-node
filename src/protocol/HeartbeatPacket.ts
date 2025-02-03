import { Packet } from "./index.js";

export class HeartbeatPacket extends Packet {
  readonly type = "heartbeat";
}
