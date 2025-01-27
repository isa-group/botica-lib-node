export { botica as default, Bot } from "./bot/index.js";

export const CONTAINER_PREFIX = "botica-";
export const SHARED_DIRECTORY = "/shared";

export { OrderListener, PacketListener } from "./protocol/BoticaClient.js";
export * from "./protocol/Packet.js";
