import {
  BotInstanceConfiguration,
  BotLifecycleConfiguration,
  BotMountConfiguration,
} from "@/configuration/index.js";

export interface BotTypeConfiguration {
  id: string;
  image: string;
  mount?: Array<BotMountConfiguration>;
  publish?: { defaultKey?: string; defaultAction?: string };
  subscribe?: [{ key: string; strategy?: "distributed" | "broadcast" }];
  lifecycle?: BotLifecycleConfiguration;
  instances: { [id: string]: BotInstanceConfiguration };
}
