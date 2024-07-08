import BotLifecycleConfiguration from "./BotLifecycleConfiguration";

export default interface ReactiveBotLifecycleConfiguration
  extends BotLifecycleConfiguration {
  type: "reactive";
  order: string;
}
