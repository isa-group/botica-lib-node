import { RequestPacket } from "../query/RequestPacket.js";
import { ShutdownResponsePacket } from "../client/ShutdownResponsePacket.js";

export class ShutdownRequestPacket extends RequestPacket<ShutdownResponsePacket> {
  readonly type = "shutdownRequest";
  readonly responsePacketType = "shutdownResponse";

  constructor(public forced?: boolean) {
    super();
  }
}
