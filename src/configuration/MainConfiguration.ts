import { Configuration } from "../util/configuration/index.js";
import { BrokerConfiguration } from "./broker/BrokerConfiguration.js";
import { BotTypeConfiguration } from "./bot/BotTypeConfiguration.js";

export interface MainConfiguration extends Configuration {
  broker: BrokerConfiguration;
  bots: { [id: string]: BotTypeConfiguration };
}
