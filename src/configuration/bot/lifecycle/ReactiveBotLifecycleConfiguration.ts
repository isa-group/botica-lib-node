import { BotLifecycleConfiguration } from "@/configuration/index.js";

export interface ReactiveBotLifecycleConfiguration
  extends BotLifecycleConfiguration {
  type: "reactive";
  order: string;
}
