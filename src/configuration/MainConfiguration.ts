import BrokerConfiguration from "./broker/BrokerConfiguration";
import BotTypeConfiguration from "./bot/BotTypeConfiguration";
import { Configuration } from "../util/configuration";

export default interface MainConfiguration extends Configuration {
  broker: BrokerConfiguration;
  bots: { [id: string]: BotTypeConfiguration };
}
