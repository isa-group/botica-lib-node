import { PacketType } from "./index.js";

export abstract class Packet {
  abstract type: PacketType;
}
