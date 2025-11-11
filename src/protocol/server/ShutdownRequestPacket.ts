import { RequestPacket } from "@/protocol/query/RequestPacket.js";
import { ShutdownResponsePacket } from "@/protocol/client/ShutdownResponsePacket.js";

export class ShutdownRequestPacket extends RequestPacket<ShutdownResponsePacket> {
  readonly type = "shutdownRequest";
  readonly responsePacketType = "shutdownResponse";

  constructor(public forced?: boolean) {
    super();
  }
}
