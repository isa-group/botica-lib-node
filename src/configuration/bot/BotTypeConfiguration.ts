import BotMountConfiguration from "./BotMountConfiguration.js";
import BotLifecycleConfiguration from "./lifecycle/BotLifecycleConfiguration.js";
import BotInstanceConfiguration from "./BotInstanceConfiguration.js";

export default interface BotTypeConfiguration {
  id: string;
  image: string;
  mount?: Array<BotMountConfiguration>;
  lifecycle: BotLifecycleConfiguration;
  publish?: { key?: string; order?: string };
  instances: { [id: string]: BotInstanceConfiguration };
}
