import BrokerConfiguration from "./broker/BrokerConfiguration.js";
import BotTypeConfiguration from "./bot/BotTypeConfiguration.js";
import { Configuration } from "../util/configuration/index.js";

export default interface MainConfiguration extends Configuration {
  broker: BrokerConfiguration;
  bots: { [id: string]: BotTypeConfiguration };
}
