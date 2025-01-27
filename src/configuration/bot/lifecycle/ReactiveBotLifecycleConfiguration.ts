import { BotLifecycleConfiguration } from "./BotLifecycleConfiguration.js";

export interface ReactiveBotLifecycleConfiguration
  extends BotLifecycleConfiguration {
  type: "reactive";
  order: string;
}
