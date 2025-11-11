import { BrokerConfiguration } from "@/configuration/index.js";

export interface RabbitMqConfiguration extends BrokerConfiguration {
  type: "rabbitmq";
  username: string;
  password: string;
  port?: number;
}
