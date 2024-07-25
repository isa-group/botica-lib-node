import BotLifecycleConfiguration from "./BotLifecycleConfiguration.js";

export default interface ReactiveBotLifecycleConfiguration
  extends BotLifecycleConfiguration {
  type: "reactive";
  keys: Array<string>;
  order: string;
}
