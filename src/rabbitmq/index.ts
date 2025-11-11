import client from "amqplib";
import logger from "@/logger.js";
import { RabbitMqClient } from "./RabbitMqClient.js";

const RETRY_SECONDS = 5;
const MAX_ATTEMPTS = 7;

export async function connect(
  username: string,
  password: string,
  host: string,
  port: number = 5672,
): Promise<RabbitMqClient> {
  const connectionOptions = {
    hostname: host,
    port: port,
    username: username,
    password: password,
  };
  let attempts = 0;
  while (attempts++ < MAX_ATTEMPTS) {
    try {
      const connection = await client.connect(connectionOptions);
      const mainChannel = await connection.createChannel();
      return new RabbitMqClient(connection, mainChannel);
    } catch (error: any) {
      if (attempts >= MAX_ATTEMPTS) break;
      logger.error(
        `Couldn't establish connection with RabbitMQ: ${error.code}. Retrying in ${RETRY_SECONDS} seconds...`,
      );
      await sleep(RETRY_SECONDS);
    }
  }
  throw new Error("Couldn't establish connection with RabbitMQ");
}

async function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export { RabbitMqClient };
