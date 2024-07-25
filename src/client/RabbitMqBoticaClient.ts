import BoticaClient, { OrderListener, PacketListener } from "./BoticaClient.js";
import Packet from "../protocol/Packet.js";
import * as rabbitmq from "../rabbitmq/index.js";
import { RabbitMqClient } from "../rabbitmq/index.js";
import { format } from "node:util";
import BotTypeConfiguration from "../configuration/bot/BotTypeConfiguration.js";
import BotInstanceConfiguration from "../configuration/bot/BotInstanceConfiguration.js";
import logger, { formatError } from "../logger.js";
import MainConfiguration from "../configuration/MainConfiguration.js";
import RabbitMqConfiguration from "../configuration/broker/RabbitMqConfiguration.js";

const ORDER_EXCHANGE = "botica.order";
const PROTOCOL_EXCHANGE = "botica.protocol";

const BOT_TYPE_ORDERS_FORMAT = "bot_type.%s.orders";
const BOT_ORDERS_FORMAT = "bot.%s.orders";

const BOT_PROTOCOL_IN_FORMAT = "bot.%s.protocol.in";
const BOT_PROTOCOL_OUT_FORMAT = "bot.%s.protocol.out";

/**
 * RabbitMQ botica client implementation.
 *
 * @author Alberto Mimbrero
 */
export default class RabbitMqBoticaClient implements BoticaClient {
  private readonly mainConfiguration: MainConfiguration;
  private readonly typeConfiguration: BotTypeConfiguration;
  private readonly botConfiguration: BotInstanceConfiguration;

  private rabbitClient?: RabbitMqClient;
  private readonly orderListeners: { [order: string]: Array<OrderListener> } =
    {};
  private readonly packetListeners: {
    [type: string]: Array<PacketListener>;
  } = {};

  constructor(
    mainConfiguration: MainConfiguration,
    typeConfiguration: BotTypeConfiguration,
    botConfiguration: BotInstanceConfiguration,
  ) {
    this.mainConfiguration = mainConfiguration;
    this.typeConfiguration = typeConfiguration;
    this.botConfiguration = botConfiguration;
  }

  async connect(): Promise<void> {
    if (this.isConnected()) {
      throw new Error("Already connected");
    }

    const rabbitConfiguration = this.mainConfiguration
      .broker as RabbitMqConfiguration;
    this.rabbitClient = await rabbitmq.connect(
      rabbitConfiguration.username,
      rabbitConfiguration.password,
      "botica-rabbitmq",
    );

    await this.enableProtocol();
    const lifecycleConfiguration =
      this.botConfiguration.lifecycle || this.typeConfiguration.lifecycle;
    if (lifecycleConfiguration.type === "reactive") {
      await this.enableOrders();
    }
  }

  private async enableProtocol(): Promise<void> {
    const protocolIn = format(BOT_PROTOCOL_IN_FORMAT, this.botConfiguration.id);
    await this.rabbitClient!.createQueue(protocolIn);
    await this.rabbitClient!.bind(PROTOCOL_EXCHANGE, protocolIn, protocolIn);
    await this.rabbitClient!.subscribe(protocolIn, (message) => {
      const packet = JSON.parse(message);
      return this.packetListeners[packet.type]?.forEach((listener) =>
        listener(packet),
      );
    });
  }

  private async enableOrders(): Promise<void> {
    const botOrdersName = format(BOT_ORDERS_FORMAT, this.botConfiguration.id);
    const botTypeOrdersName = format(
      BOT_TYPE_ORDERS_FORMAT,
      this.typeConfiguration.id,
    );

    await this.rabbitClient!.createQueue(botOrdersName);
    await this.rabbitClient!.bind(ORDER_EXCHANGE, botOrdersName, botOrdersName);
    // bot_type orders queue is already created by director

    await this.listenToOrders(botOrdersName);
    await this.listenToOrders(botTypeOrdersName);
  }

  private async listenToOrders(queue: string): Promise<void> {
    logger.debug(`Listening to ${queue}`);
    await this.rabbitClient!.subscribe(queue, (raw) => {
      const message = JSON.parse(raw);
      this.callOrderListeners(message.order, message.message);
    });
  }

  private callOrderListeners(order: string, message: string) {
    this.orderListeners[order]?.forEach((listener) => {
      try {
        listener(order, message);
      } catch (error) {
        logger.error(
          `An exception was risen during the bot action: ${formatError(error)}`,
        );
      }
    });
  }

  isConnected(): boolean {
    return this.rabbitClient != null && this.rabbitClient.isConnected();
  }

  registerOrderListener(
    order: string,
    callback: (order: string, message: string) => void,
  ): void {
    logger.debug(`New order listener for ${order}`);
    (this.orderListeners[order] ||= []).push(callback);
  }

  async publishOrder(
    key: string,
    order: string,
    message: string,
  ): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Client is not connected yet!");
    }
    const contents = JSON.stringify({ order, message });
    logger.debug(`Publishing order with key ${key}: ${contents}`);
    await this.rabbitClient!.publish(ORDER_EXCHANGE, key, contents);
  }

  registerPacketListener(packetType: string, callback: PacketListener): void {
    (this.packetListeners[packetType] ||= []).push(callback);
  }

  async sendPacket(packet: Packet): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Client is not connected yet!");
    }
    await this.rabbitClient!.publish(
      PROTOCOL_EXCHANGE,
      format(BOT_PROTOCOL_OUT_FORMAT, this.botConfiguration.id),
      JSON.stringify(packet),
    );
  }

  async close(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Client is not connected!");
    }
    await this.rabbitClient!.closeConnection();
  }
}
