import BotLifecycleConfiguration from "./lifecycle/BotLifecycleConfiguration";

export default interface BotInstanceConfiguration {
  id: string;
  environment?: Array<string>;
  lifecycle?: BotLifecycleConfiguration;
}
