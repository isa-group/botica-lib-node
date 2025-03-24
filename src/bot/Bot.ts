import logger, { formatError } from "../logger.js";
import { CONTAINER_PREFIX } from "../index.js";
import { ShutdownHandler } from "./shutdown/ShutdownHandler.js";
import {
  BotInstanceConfiguration,
  BotLifecycleConfiguration,
  BotTypeConfiguration,
  ProactiveBotLifecycleConfiguration,
  ReactiveBotLifecycleConfiguration,
} from "../configuration/index.js";
import {
  BoticaClient,
  HeartbeatPacket,
  OrderListener,
  ReadyPacket,
} from "../protocol/index.js";
import { schedule } from "../util/index.js";

/**
 * A bot instance in a botica environment.
 *
 * Starting the bot does not block the execution. Everything is managed asynchronously.
 *
 * @author Alberto Mimbrero
 */
export class Bot {
  private botTypeConfiguration: BotTypeConfiguration;
  private botConfiguration: BotInstanceConfiguration;

  private boticaClient: BoticaClient;
  private running = false;

  private proactiveTask?: () => void;
  public readonly shutdownHandler: ShutdownHandler;

  constructor(
    boticaClient: BoticaClient,
    botTypeConfiguration: BotTypeConfiguration,
    botConfiguration: BotInstanceConfiguration,
  ) {
    this.boticaClient = boticaClient;
    this.botTypeConfiguration = botTypeConfiguration;
    this.botConfiguration = botConfiguration;
    this.shutdownHandler = new ShutdownHandler(boticaClient);
  }

  /**
   * Sets the task for this bot.
   *
   * @param task the task to set
   * @throws Error if the bot lifecycle type is not `proactive`
   */
  proactive(task: () => void): void {
    this.setProactiveTask(task);
  }

  /**
   * Sets the task for this bot.
   *
   * @param task the task to set
   * @throws Error if the bot lifecycle type is not `proactive`
   */
  setProactiveTask(task: () => void): void {
    if (this.getLifecycleConfiguration().type !== "proactive") {
      throw new Error(
        "Cannot register a proactive task because this bot is not configured as proactive",
      );
    }
    if (this.running) {
      throw new Error("bot is already running");
    }
    this.proactiveTask = task;
  }

  /**
   * Registers the given listener for the provided order.
   *
   * @param order the order to listen to
   * @param callback the callback for the order
   */
  on(order: string | undefined, callback: OrderListener): void {
    this.registerOrderListener(order, callback);
  }

  /**
   * Registers the given listener for the provided order.
   *
   * @param order the order to listen to
   * @param callback the callback for the order
   */
  onOrder(order: string | undefined, callback: OrderListener): void {
    this.registerOrderListener(order, callback);
  }

  /**
   * Registers the given listener for the default order. The order is taken from the main
   * configuration file.
   *
   * @param callback the listener to register
   * @throws Error if the bot lifecycle type is not `reactive`
   */
  onDefaultOrder(callback: OrderListener): void {
    this.onOrder(undefined, callback);
  }

  /**
   * Registers the given listener for the provided order.
   *
   * @param order the order to listen to
   * @param callback the callback to register
   */
  registerOrderListener(
    order: string | undefined,
    callback: OrderListener,
  ): void {
    if (!order) {
      const lifecycleConfiguration =
        this.getLifecycleConfiguration() as ReactiveBotLifecycleConfiguration;
      if (
        lifecycleConfiguration?.type != "reactive" ||
        !lifecycleConfiguration.order
      ) {
        throw new Error(
          "no default order specified for this bot in the infrastructure configuration file",
        );
      }

      order = lifecycleConfiguration.order;
    }

    this.boticaClient.registerOrderListener(order, callback);
  }

  /**
   * Registers the given listener for the default order. The order is taken from the main
   * configuration file.
   *
   * @param callback the callback to register
   */
  registerDefaultOrderListener(callback: OrderListener): void {
    this.registerOrderListener(undefined, callback);
  }

  /**
   * Publishes an order with the given message. The key and order are taken from the main
   * configuration file.
   *
   * @param message the message of the order. If not a `string`, it will be stringified using
   * `JSON.stringify()`
   */
  publishOrder(message: string | any): Promise<void>;

  /**
   * Publishes an order with the given message to the given key.
   *
   * @param message the message of the order. If not a `string`, it will be stringified using
   * `JSON.stringify()`
   * @param key the key to publish the order with
   * @param order the order to publish
   */
  publishOrder(
    message: string | any,
    key: string,
    order: string,
  ): Promise<void>;

  async publishOrder(
    message: string | any,
    key?: string,
    order?: string,
  ): Promise<void> {
    if (!key || !order) {
      const publishConfiguration = this.botTypeConfiguration.publish;
      if (!isPublishDefined(publishConfiguration)) {
        throw new Error(
          "cannot publish order: no publish section present in the bot type configuration.",
        );
      }
      key = publishConfiguration!.key!;
      order = publishConfiguration!.order!;
    }
    if (typeof message !== "string") message = JSON.stringify(message);
    await this.boticaClient.publishOrder(key, order, message);
  }

  /**
   * Returns the hostname of this bot's container.
   */
  get hostname(): string {
    return this.getBotHostname(this.botConfiguration.id);
  }

  /**
   * Returns the hostname of the given bot's container.
   *
   * @param botId the ID of the bot instance
   */
  getBotHostname(botId: string): string {
    return CONTAINER_PREFIX + botId;
  }

  /**
   * Starts the bot.
   *
   * @throws Error if the connection with the message broker cannot be established
   */
  async start(): Promise<void> {
    logger.info("Establishing connection with the message broker...");
    await this.boticaClient.connect();
    this.running = true;
    logger.info("Connected to the message broker.");

    if (this.getLifecycleConfiguration().type === "proactive") {
      this.startProactiveScheduler();
    }

    this.setupHeartbeat();
    await this.boticaClient.sendPacket(new ReadyPacket());
    logger.info("Bot started.");
  }

  private setupHeartbeat() {
    this.boticaClient.registerPacketListener(
      "heartbeat",
      async () => await this.boticaClient.sendPacket(new HeartbeatPacket()),
    );
  }

  private startProactiveScheduler(): void {
    if (!this.proactiveTask) {
      throw new Error(
        "This bot is configured as a proactive bot, but no proactive task has been registered",
      );
    }
    const lifecycleConfiguration =
      this.getLifecycleConfiguration() as ProactiveBotLifecycleConfiguration;

    if (lifecycleConfiguration.period > 0) {
      this.scheduleRepeatingTask(lifecycleConfiguration);
    } else {
      setTimeout(async () => {
        if (this.isRunning) {
          this.runProactiveTask();
          await this.stop();
        }
      }, lifecycleConfiguration.initialDelay * 1000);
    }
  }

  private scheduleRepeatingTask(
    lifecycleConfiguration: ProactiveBotLifecycleConfiguration,
  ) {
    const intervalId = schedule(
      () => {
        if (!this.isRunning) {
          clearInterval(intervalId);
          return;
        }
        this.runProactiveTask();
      },
      lifecycleConfiguration.initialDelay * 1000,
      lifecycleConfiguration.period * 1000,
    );
  }

  private runProactiveTask() {
    try {
      this.proactiveTask!();
    } catch (error) {
      logger.error(
        `An exception was risen during the bot proactive task: ${formatError(error)}`,
      );
    }
  }

  /**
   * Returns whether the bot is running.
   */
  get isRunning(): boolean {
    return this.running;
  }

  /**
   * Closes the connection and stops the bot.
   */
  async stop(): Promise<void> {
    if (!this.running) {
      throw new Error("Bot is not running");
    }
    logger.info("Closing connection with the message broker...");
    await this.boticaClient.close();
    this.running = false;
    logger.info("Bot stopped.");
  }

  private getLifecycleConfiguration(): BotLifecycleConfiguration {
    return (
      this.botConfiguration.lifecycle ||
      this.botTypeConfiguration.lifecycle || { type: "reactive" }
    );
  }
}

function isPublishDefined(
  publishConfiguration: { key?: string; order?: string } | undefined,
) {
  return (
    publishConfiguration &&
    publishConfiguration.key &&
    publishConfiguration.key.trim() !== "" &&
    publishConfiguration.order &&
    publishConfiguration.order.trim() !== ""
  );
}
