import { Packet } from "./Packet.js";
import { HeartbeatPacket } from "./HeartbeatPacket.js";
import { BotPacket } from "./client/BotPacket.js";
import { ReadyPacket } from "./client/ReadyPacket.js";
import { ShutdownResponsePacket } from "./client/ShutdownResponsePacket.js";
import { ShutdownRequestPacket } from "./server/ShutdownRequestPacket.js";

export const packetRegistry: Record<string, new () => Packet> = {
  bot: BotPacket,
  heartbeat: HeartbeatPacket,
  ready: ReadyPacket,
  shutdownRequest: ShutdownRequestPacket,
  shutdownResponse: ShutdownResponsePacket,
};

export type PacketType = keyof typeof packetRegistry;

export type PacketMap = {
  [T in PacketType]: InstanceType<(typeof packetRegistry)[T]>;
};

export function deserializePacket(raw: string): Packet {
  const parsed = JSON.parse(raw);

  if (!parsed.type || typeof parsed.type !== "string") {
    throw new Error("Invalid packet: missing or invalid 'type' property");
  }

  const PacketClass = packetRegistry[parsed.type];
  if (!PacketClass) {
    throw new Error(`Unknown packet type: ${parsed.type}`);
  }

  return Object.assign(new PacketClass(), parsed);
}

export * from "./BoticaClient.js";
export * from "./RabbitMqBoticaClient.js";

export {
  Packet,
  HeartbeatPacket,
  BotPacket,
  ReadyPacket,
  ShutdownResponsePacket,
  ShutdownRequestPacket,
};

export * from "./query/RequestPacket.js";
export * from "./query/ResponsePacket.js";
export * from "./query/QueryHandler.js";
export * from "./query/RequestPacket.js";
export * from "./query/ResponsePacket.js";
