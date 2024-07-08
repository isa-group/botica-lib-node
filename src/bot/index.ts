import BotInstanceConfiguration from "../configuration/bot/BotInstanceConfiguration";
import BotTypeConfiguration from "../configuration/bot/BotTypeConfiguration";
import BoticaClient, { OrderListener } from "../client/BoticaClient";
import BotLifecycleConfiguration from "../configuration/bot/lifecycle/BotLifecycleConfiguration";
import ReactiveBotLifecycleConfiguration from "../configuration/bot/lifecycle/ReactiveBotLifecycleConfiguration";
import logger, { formatError } from "../logger";
import ProactiveBotLifecycleConfiguration from "../configuration/bot/lifecycle/ProactiveBotLifecycleConfiguration";
import { loadConfigurationFile } from "../util/configuration";
import MainConfiguration from "../configuration/MainConfiguration";
import RabbitMqBoticaClient from "../client/RabbitMqBoticaClient";
import fs from "fs";

const CONFIG_FILE_PATH = "/run/secrets/botica-config";

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

  private proactiveAction?: () => void;

  constructor(
    boticaClient: BoticaClient,
    botTypeConfiguration: BotTypeConfiguration,
    botConfiguration: BotInstanceConfiguration,
  ) {
    this.boticaClient = boticaClient;
    this.botTypeConfiguration = botTypeConfiguration;
    this.botConfiguration = botConfiguration;
  }

  /**
   * Sets the action for this bot.
   *
   * @param action the action to set
   * @throws Error if the bot lifecycle type is not `proactive`
   */
  proactive(action: () => void): void {
    this.setProactiveAction(action);
  }

  /**
   * Sets the action for this bot.
   *
   * @param action the action to set
   * @throws Error if the bot lifecycle type is not `proactive`
   */
  setProactiveAction(action: () => void): void {
    if (this.getLifecycleConfiguration().type !== "proactive") {
      throw new Error("bot lifecycle type is not proactive");
    }
    this.proactiveAction = action;
  }

  /**
   * Registers the given listener for the main order. The order is taken from the main
   * configuration file.
   *
   * @param orderListener the listener to register
   * @throws Error if the bot lifecycle type is not `reactive`
   */
  onOrderReceived(orderListener: OrderListener): void;

  /**
   * Registers the given listener for the provided order.
   *
   * @param orderListener the listener to register
   * @param order the order to listen to
   * @throws Error if the bot lifecycle type is not `reactive`
   */
  onOrderReceived(orderListener: OrderListener, order?: string): void;

  onOrderReceived(orderListener: OrderListener, order?: string): void {
    this.registerOrderListener(orderListener, order);
  }

  /**
   * Registers the given listener for the main order. The order is taken from the main
   * configuration file.
   *
   * @param orderListener the listener to register
   * @throws Error if the bot lifecycle type is not `reactive`
   */
  registerOrderListener(orderListener: OrderListener): void;

  /**
   * Registers the given listener for the provided order.
   *
   * @param orderListener the listener to register
   * @param order the order to listen to
   * @throws Error if the bot lifecycle type is not `reactive`
   */
  registerOrderListener(orderListener: OrderListener, order?: string): void;

  registerOrderListener(orderListener: OrderListener, order?: string): void {
    if (this.getLifecycleConfiguration().type !== "reactive") {
      throw new Error("bot lifecycle type is not reactive");
    }
    if (!order) {
      const lifecycleConfiguration =
        this.getLifecycleConfiguration() as ReactiveBotLifecycleConfiguration;
      order = lifecycleConfiguration.order;
    }
    this.boticaClient.registerOrderListener(order, orderListener);
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
      key = key || publishConfiguration.key;
      order = order || publishConfiguration.order;
    }
    if (typeof message !== "string") message = JSON.stringify(message);
    await this.boticaClient.publishOrder(key, order, message);
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
    logger.info("Bot started.");
  }

  private startProactiveScheduler(): void {
    if (!this.proactiveAction) {
      throw new Error("undefined action for proactive bot");
    }

    const lifecycleConfiguration =
      this.getLifecycleConfiguration() as ProactiveBotLifecycleConfiguration;
    const interval = setInterval(() => {
      if (!this.isRunning() || !this.proactiveAction) {
        clearInterval(interval);
        return;
      }
      try {
        this.proactiveAction();
      } catch (error) {
        logger.error(
          `an exception was risen during the bot action: ${formatError(error)}`,
        );
      }
    }, lifecycleConfiguration.period * 1000);
  }

  /**
   * Returns whether the bot is running.
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Closes the connection and stops the bot.
   */
  async stop(): Promise<void> {
    if (!this.running) {
      throw new Error("Bot is not running");
    }
    await this.boticaClient.close();
    this.running = false;
  }

  private getLifecycleConfiguration(): BotLifecycleConfiguration {
    return (
      this.botConfiguration.lifecycle || this.botTypeConfiguration.lifecycle
    );
  }
}

export async function botica(): Promise<Bot> {
  const configuration = await loadConfiguration(CONFIG_FILE_PATH);
  const botType = process.env.BOTICA_BOT_TYPE;
  const botId = process.env.BOTICA_BOT_ID;

  const typeConfiguration = configuration.bots[botType!];
  const botConfiguration = typeConfiguration.instances[botId!];
  const boticaClient = buildClient(
    configuration,
    typeConfiguration,
    botConfiguration,
  );

  return new Bot(boticaClient, typeConfiguration, botConfiguration);
}

async function loadConfiguration(path: string): Promise<MainConfiguration> {
  if (!fs.existsSync(path) || !fs.lstatSync(path).isFile()) {
    throw new Error(
      "Couldn't find the needed configuration file. Are you manually starting this bot? Bots " +
        "should be started inside a container conveniently created by the botica director!",
    );
  }
  return await loadConfigurationFile<MainConfiguration>(CONFIG_FILE_PATH);
}

function buildClient(
  mainConfiguration: MainConfiguration,
  typeConfiguration: BotTypeConfiguration,
  botConfiguration: BotInstanceConfiguration,
) {
  if (mainConfiguration.broker.type === "rabbitmq") {
    return new RabbitMqBoticaClient(
      mainConfiguration,
      typeConfiguration,
      botConfiguration,
    );
  }
  throw new Error("Unsupported broker type");
}
