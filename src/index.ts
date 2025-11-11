export const CONTAINER_PREFIX = "botica-";
export const SHARED_DIRECTORY = "/shared/";

export * from "@/bot/index.js";
export * from "@/configuration/index.js";
export type { OrderListener } from "@/protocol/index.js";

export { botica as default } from "@/bot/index.js";
