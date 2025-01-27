import { BotLifecycleConfiguration } from "./BotLifecycleConfiguration.js";

export interface ProactiveBotLifecycleConfiguration
  extends BotLifecycleConfiguration {
  type: "proactive";
  initialDelay: number;
  period: number;
}
