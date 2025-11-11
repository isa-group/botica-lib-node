import { BotLifecycleConfiguration } from "@/configuration/index.js";

export interface BotInstanceConfiguration {
  id: string;
  environment?: Array<string>;
  lifecycle?: BotLifecycleConfiguration;
}
