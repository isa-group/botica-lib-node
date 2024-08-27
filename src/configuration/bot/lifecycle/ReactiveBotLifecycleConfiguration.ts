import BotLifecycleConfiguration from "./BotLifecycleConfiguration.js";

export default interface ReactiveBotLifecycleConfiguration
  extends BotLifecycleConfiguration {
  type: "reactive";
  order: string;
}
