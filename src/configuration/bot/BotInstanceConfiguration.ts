import { BotLifecycleConfiguration } from "./lifecycle/BotLifecycleConfiguration.js";

export interface BotInstanceConfiguration {
  id: string;
  environment?: Array<string>;
  lifecycle?: BotLifecycleConfiguration;
}
