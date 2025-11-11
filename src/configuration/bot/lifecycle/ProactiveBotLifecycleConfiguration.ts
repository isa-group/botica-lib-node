import { BotLifecycleConfiguration } from "@/configuration/index.js";

export interface ProactiveBotLifecycleConfiguration
  extends BotLifecycleConfiguration {
  type: "proactive";
  initialDelay: number;
  period: number;
}
