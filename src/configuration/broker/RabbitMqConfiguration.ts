import BrokerConfiguration from "./BrokerConfiguration";

export default interface RabbitMqConfiguration extends BrokerConfiguration {
  type: "rabbitmq";
  username: string;
  password: string;
  port?: number;
}
