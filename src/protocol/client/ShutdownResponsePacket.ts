import { ResponsePacket } from "@/protocol/query/ResponsePacket.js";

export class ShutdownResponsePacket extends ResponsePacket {
  readonly type = "shutdownResponse";

  constructor(public ready?: boolean) {
    super();
  }
}
