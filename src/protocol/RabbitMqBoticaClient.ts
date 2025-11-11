import { format } from "node:util";
import logger, { formatError } from "../logger.js";
import { CONTAINER_PREFIX } from "../index.js";
import {
  BoticaClient,
  BotPacket,
  deserializePacket,
  OrderListener,
  Packet,
  PacketListener,
  PacketMap,
  packetRegistry,
  PacketType,
  QueryHandler,
  QueryListener,
  RequestPacket,
  ResponsePacket,
} from "@/protocol/index.js";
import {
  BotInstanceConfiguration,
  BotTypeConfiguration,
  MainConfiguration,
  RabbitMqConfiguration,
} from "@/configuration/index.js";
import { connect, RabbitMqClient } from "@/rabbitmq/index.js";

const ORDER_EXCHANGE = "botica.order";
const PROTOCOL_EXCHANGE = "botica.protocol";

const BOT_TYPE_ORDERS_FORMATS = {
  distributed: "bot_type.%s.orders.distributed",
  broadcast: "bot_type.%s.orders.broadcast",
};

const DIRECTOR_PROTOCOL = "director.protocol";
const BOT_PROTOCOL_IN_FORMAT = "bot.%s.protocol";
const BOT_ORDERS_FORMAT = "bot.%s.orders";

/**
 * RabbitMQ botica client implementation.
 *
 * @author Alberto Mimbrero
 */
export class RabbitMqBoticaClient implements BoticaClient {
  private readonly mainConfiguration: MainConfiguration;
  private readonly typeConfiguration: BotTypeConfiguration;
  private readonly botConfiguration: BotInstanceConfiguration;

  private readonly queryHandler = new QueryHandler();
  private rabbitClient?: RabbitMqClient;
  private readonly orderListeners: { [order: string]: Array<OrderListener> } =
    {};
  private readonly packetListeners: {
    [T in PacketType]: Array<PacketListener<PacketMap[T]>>;
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
    this.rabbitClient = await connect(
      rabbitConfiguration.username,
      rabbitConfiguration.password,
      `${CONTAINER_PREFIX}rabbitmq`,
    );

    await this.installProtocol();
    await this.enableOrders();
  }

  private async installProtocol(): Promise<void> {
    const protocolIn = format(BOT_PROTOCOL_IN_FORMAT, this.botConfiguration.id);
    await this.rabbitClient!.createQueue(protocolIn);
    await this.rabbitClient!.bind(PROTOCOL_EXCHANGE, protocolIn, protocolIn);
    await this.rabbitClient!.subscribe(protocolIn, this.callPacketListeners);
  }

  private callPacketListeners = (rawPacket: string) => {
    const packet = deserializePacket(rawPacket);
    this.packetListeners[packet.type]?.forEach((listener) => {
      try {
        listener(packet);
      } catch (e) {
        logger.error(
          `An error was thrown while executing a packet listener: ${formatError(e)}`,
        );
      }
    });
  };

  private async enableOrders(): Promise<void> {
    const strategies = new Set(
      this.typeConfiguration.subscribe?.map(
        // if not present, default is distributed
        (subscription) => subscription.strategy || "distributed",
      ),
    );

    for (let strategy of strategies) {
      const queue = format(
        BOT_TYPE_ORDERS_FORMATS[strategy],
        this.typeConfiguration.id,
      );
      await this.listenToOrders(queue);
    }
    await this.listenToOwnQueue();
  }

  private async listenToOwnQueue(): Promise<void> {
    const queue = format(BOT_ORDERS_FORMAT, this.botConfiguration.id);
    await this.rabbitClient!.createQueue(queue);
    await this.rabbitClient!.bind(ORDER_EXCHANGE, queue, queue);
    await this.listenToOrders(queue);
  }

  private async listenToOrders(queue: string): Promise<void> {
    logger.debug(`Listening to ${queue}`);
    await this.rabbitClient!.subscribe(queue, (raw) => {
      logger.debug(`Incoming order from ${queue}: ${raw}`);
      try {
        const order = JSON.parse(raw);
        const { action, payload } = order;
        this.callOrderListeners(action, payload);
      } catch (err) {
        logger.error(`Failed to parse incoming order: ${formatError(err)}`);
      }
    });
  }

  private callOrderListeners(action: string, payload: any) {
    if (!action) return;
    this.orderListeners[action]?.forEach((listener) => {
      try {
        listener(payload, action);
      } catch (e) {
        logger.error(
          `An error was thrown while consuming an order: ${formatError(e)}`,
        );
      }
    });
  }

  isConnected(): boolean {
    return this.rabbitClient != null && this.rabbitClient.isConnected();
  }

  registerOrderListener(order: string, callback: OrderListener): void {
    logger.debug(`New order listener for ${order}`);
    (this.orderListeners[order] ||= []).push(callback);
  }

  async publishOrder(
    key: string,
    action: string,
    payload: string,
  ): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Client is not connected yet!");
    }
    const contents = JSON.stringify({ action, payload });
    logger.debug(`Publishing order with key ${key}: ${contents}`);
    await this.rabbitClient!.publish(ORDER_EXCHANGE, key, contents);
  }

  registerPacketListener<P extends Packet>(
    packetType: P["type"],
    callback: PacketListener<P>,
  ): void {
    this.ensureResponsePacketListener(packetType);
    this.packetListeners[packetType].push(callback as PacketListener<Packet>);
  }

  registerQueryListener<
    T extends PacketType,
    RequestPacketT extends PacketMap[T] & RequestPacket<ResponsePacket>,
    ResponsePacketT extends ResponsePacket,
  >(
    packetType: T,
    callback: QueryListener<RequestPacketT, ResponsePacketT>,
  ): void {
    this.ensureResponsePacketListener(packetType);
    this.registerPacketListener(packetType, async (request: RequestPacketT) => {
      const response = await callback(request);
      response.requestId = request.requestId;
      await this.sendPacket(response);
    });
  }

  ensureResponsePacketListener(packetType: PacketType) {
    const listeners = (this.packetListeners[packetType] ||= []);
    if (
      listeners.length > 0 &&
      packetRegistry[packetType].prototype instanceof ResponsePacket
    ) {
      listeners.push((response: ResponsePacket) =>
        this.queryHandler.acceptResponse(response),
      );
    }
  }

  async sendPacket(packet: Packet): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Client is not connected yet!");
    }
    const wrapper = new BotPacket(this.botConfiguration.id, packet);
    const raw = JSON.stringify(wrapper);
    await this.rabbitClient!.publish(PROTOCOL_EXCHANGE, DIRECTOR_PROTOCOL, raw);
  }

  async sendQuery<ResponsePacketT extends ResponsePacket>(
    packet: RequestPacket<ResponsePacketT>,
    callback: PacketListener<ResponsePacketT>,
    timeoutCallback: () => void,
    timeoutMs: number = 3000,
  ): Promise<void> {
    this.ensureResponsePacketListener(packet.responsePacketType);
    this.queryHandler.registerQuery(
      packet,
      callback,
      timeoutCallback,
      timeoutMs,
    );
  }

  async close(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error("Client is not connected!");
    }
    await this.rabbitClient!.closeConnection();
  }
}
