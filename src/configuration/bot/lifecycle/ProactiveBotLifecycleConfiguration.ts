import BotLifecycleConfiguration from "./BotLifecycleConfiguration.js";

export default interface ProactiveBotLifecycleConfiguration
  extends BotLifecycleConfiguration {
  type: "proactive";
  initialDelay: number;
  period: number;
}
