import { Packet } from "@/protocol/index.js";

export class HeartbeatPacket extends Packet {
  readonly type = "heartbeat";
}
