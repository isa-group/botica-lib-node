import { PacketType } from "@/protocol/index.js";

export abstract class Packet {
  abstract type: PacketType;
}
