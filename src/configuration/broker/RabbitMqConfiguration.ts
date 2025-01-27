import { BrokerConfiguration } from "./BrokerConfiguration.js";

export interface RabbitMqConfiguration extends BrokerConfiguration {
  type: "rabbitmq";
  username: string;
  password: string;
  port?: number;
}
