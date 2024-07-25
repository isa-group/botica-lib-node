import BrokerConfiguration from "./BrokerConfiguration.js";

export default interface RabbitMqConfiguration extends BrokerConfiguration {
  type: "rabbitmq";
  username: string;
  password: string;
  port?: number;
}
