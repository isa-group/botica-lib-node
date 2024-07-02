import BotMountConfiguration from "./BotMountConfiguration";
import BotLifecycleConfiguration from "./lifecycle/BotLifecycleConfiguration";
import BotInstanceConfiguration from "./BotInstanceConfiguration";

export default interface BotTypeConfiguration {
  id: string;
  image: string;
  mount?: Array<BotMountConfiguration>;
  lifecycle: BotLifecycleConfiguration;
  publish: { key: string; order: string };
  subscribe?: Array<string>;
  instances: { [id: string]: BotInstanceConfiguration };
}
