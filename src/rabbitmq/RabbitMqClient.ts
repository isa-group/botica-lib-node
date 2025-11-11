import { Channel, Connection } from "amqplib";
import logger, { formatError } from "@/logger.js";

export class RabbitMqClient {
  private readonly connection: Connection;
  private readonly mainChannel: Channel;
  private connected = true;

  constructor(connection: Connection, mainChannel: Channel) {
    this.connection = connection;
    this.mainChannel = mainChannel;
    this.connection.on("close", () => (this.connected = false));
    this.connection.on("error", (err) => {
      logger.error(`Connection error: ${err.message}`);
      this.connected = false;
    });
  }

  public async createQueue(queueName: string): Promise<void> {
    await this.mainChannel.assertQueue(queueName, { durable: false });
  }

  public async bind(
    exchange: string,
    routingKey: string,
    queue: string,
  ): Promise<void> {
    await this.mainChannel.bindQueue(queue, exchange, routingKey);
  }

  public async publish(
    exchange: string,
    routingKey: string,
    message: string,
  ): Promise<void> {
    this.mainChannel.publish(exchange, routingKey, Buffer.from(message));
  }

  public async subscribe(
    queue: string,
    consumer: (message: string) => void,
  ): Promise<void> {
    const channel = await this.connection.createChannel();
    await channel.prefetch(1);
    await channel.consume(queue, (msg) => {
      if (!msg) return;
      try {
        consumer(msg.content.toString());
        channel.ack(msg, false);
      } catch (e) {
        logger.error(
          `An error was thrown while consuming an order: ${formatError(e)}`,
        );
        channel.reject(msg, false);
      }
    });
  }

  public async closeConnection(): Promise<void> {
    await this.connection.close();
  }

  public isConnected(): boolean {
    return this.connection && this.connected;
  }
}
