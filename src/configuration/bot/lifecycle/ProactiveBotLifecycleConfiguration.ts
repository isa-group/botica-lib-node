import BotLifecycleConfiguration from "./BotLifecycleConfiguration";

export default interface ProactiveBotLifecycleConfiguration
  extends BotLifecycleConfiguration {
  type: "proactive";
  initialDelay: number;
  period: number;
}
