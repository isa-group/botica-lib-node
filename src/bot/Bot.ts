import logger, { formatError } from "@/logger.js";
import { CONTAINER_PREFIX, ShutdownHandler } from "@/index.js";
import {
  BotInstanceConfiguration,
  BotLifecycleConfiguration,
  BotTypeConfiguration,
  ProactiveBotLifecycleConfiguration,
  ReactiveBotLifecycleConfiguration,
} from "@/configuration/index.js";
import {
  BoticaClient,
  HeartbeatPacket,
  OrderListener,
  ReadyPacket,
} from "@/protocol/index.js";

/**
 * A bot instance in a Botica environment.
 *
 * @author Alberto Mimbrero
 */
export class Bot {
  private running = false;
  private proactiveTask?: () => void | Promise<void>;
  private proactiveTaskInterval: NodeJS.Timeout | null = null;

  public readonly shutdownHandler: ShutdownHandler;

  constructor(
    private readonly boticaClient: BoticaClient,
    private readonly botTypeConfiguration: BotTypeConfiguration,
    private readonly botConfiguration: BotInstanceConfiguration,
  ) {
    this.shutdownHandler = new ShutdownHandler(this.boticaClient);
  }

  proactive = this.setProactiveTask;

  /**
   * Sets the proactive task for this bot. The task will be executed
   * periodically based on the bot's configuration.
   *
   * @param task The asynchronous or synchronous function to execute.
   * @throws Error if the bot is not configured as 'proactive'.
   */
  setProactiveTask(task: () => void | Promise<void>): void {
    if (this.getLifecycleConfiguration().type !== "proactive") {
      throw new Error(
        "Cannot register a proactive task because this bot is not configured as proactive.",
      );
    }
    if (this.running) {
      throw new Error("Cannot set proactive task while the bot is running.");
    }
    this.proactiveTask = task;
  }

  on = this.onOrder;
  registerOrderListener = this.onOrder;

  /**
   * Registers a listener for an order with a specific action.
   *
   * @param action The action to listen for.
   * @param listener A callback function that receives the payload.
   */
  onOrder(action: string, listener: OrderListener): void {
    this.boticaClient.registerOrderListener(action, listener);
  }

  registerDefaultOrderListener = this.onDefaultOrder;

  /**
   * Registers a listener for an order with the default action defined in the configuration.
   *
   * @param listener A callback function that receives the payload.
   * @throws Error if no default action is specified in the configuration.
   */
  onDefaultOrder(listener: OrderListener): void {
    const lifecycleConfig =
      this.getLifecycleConfiguration() as ReactiveBotLifecycleConfiguration;

    if (
      lifecycleConfig?.type !== "reactive" ||
      !lifecycleConfig.defaultAction
    ) {
      throw new Error(
        "No default action specified for this bot in the environment file.",
      );
    }

    this.onOrder(lifecycleConfig.defaultAction, listener);
  }

  publish = this.publishOrder;

  /**
   * Publishes an order with the given key and action.
   *
   * @param key The key to publish the order with.
   * @param action The action of the order.
   * @param payload The payload of the order. If not a string, it will be
   *   stringified using JSON.stringify().
   */
  async publishOrder(key: string, action: string, payload: any): Promise<void> {
    const serializedPayload =
      typeof payload === "string" ? payload : JSON.stringify(payload);

    await this.boticaClient.publishOrder(key, action, serializedPayload);
  }

  /**
   * Publishes an order using the default key and action from the configuration.
   *
   * @param payload The payload of the order. If not a string, it will be
   *   stringified using JSON.stringify().
   */
  async publishDefaultOrder(payload: any): Promise<void> {
    const { publish: publishConfig } = this.botTypeConfiguration;
    if (
      !publishConfig?.defaultKey?.trim() ||
      !publishConfig?.defaultAction?.trim()
    ) {
      throw new Error(
        "Cannot publish order: 'publish.defaultKey' and 'publish.defaultAction' are not defined in the bot type configuration.",
      );
    }
    const key = publishConfig.defaultKey;
    const action = publishConfig.defaultAction;
    return this.publishOrder(key, action, payload);
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
   * Starts the bot and connects to the message broker.
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new Error("Bot is already running.");
    }

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
        "This bot is configured as proactive, but no proactive task has been registered via setProactiveTask().",
      );
    }
    const lifecycleConfig =
      this.getLifecycleConfiguration() as ProactiveBotLifecycleConfiguration;

    const runTask = async () => {
      if (!this.running) return;
      try {
        await this.proactiveTask!();
      } catch (error) {
        logger.error(
          `An exception was thrown during the bot proactive task: ${formatError(
            error,
          )}`,
        );
      }
    };

    setTimeout(() => {
      runTask();

      if (lifecycleConfig.period > 0 && this.running) {
        this.proactiveTaskInterval = setInterval(
          runTask,
          lifecycleConfig.period * 1000,
        );
      } else if (this.running) {
        this.stop().catch((err) =>
          logger.error(`Error during one-shot task shutdown: ${err}`),
        );
      }
    }, lifecycleConfig.initialDelay * 1000);
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
      return;
    }
    logger.info("Stopping bot...");
    this.running = false;

    logger.info("Closing connection with the message broker...");
    await this.boticaClient.close();
    logger.info("Bot stopped.");
  }

  private getLifecycleConfiguration(): BotLifecycleConfiguration {
    return (
      this.botConfiguration.lifecycle ??
      this.botTypeConfiguration.lifecycle ?? { type: "reactive" }
    );
  }
}
