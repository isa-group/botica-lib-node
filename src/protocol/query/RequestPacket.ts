import { Packet } from "../Packet.js";
import { ResponsePacket } from "./ResponsePacket.js";

export abstract class RequestPacket<
  ResponsePacketT extends ResponsePacket,
> extends Packet {
  abstract responsePacketType: ResponsePacketT["type"];

  protected constructor(public requestId?: string) {
    super();
  }
}
