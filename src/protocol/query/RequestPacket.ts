import { Packet, ResponsePacket } from "@/protocol/index.js";

export abstract class RequestPacket<
  ResponsePacketT extends ResponsePacket,
> extends Packet {
  abstract responsePacketType: ResponsePacketT["type"];

  protected constructor(public requestId?: string) {
    super();
  }
}
