import BotLifecycleConfiguration from "./lifecycle/BotLifecycleConfiguration.js";

export default interface BotInstanceConfiguration {
  id: string;
  environment?: Array<string>;
  lifecycle?: BotLifecycleConfiguration;
}
