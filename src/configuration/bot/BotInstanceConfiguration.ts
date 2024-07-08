import BotLifecycleConfiguration from "./lifecycle/BotLifecycleConfiguration";

export default interface BotInstanceConfiguration {
  id: string;
  persistent: boolean;
  environment?: Array<string>;
  lifecycle?: BotLifecycleConfiguration;
}
