import { Bot } from "./Bot.js";
import {
  BotInstanceConfiguration,
  BotTypeConfiguration,
  MainConfiguration,
} from "@/index.js";
import { loadConfigurationFile } from "@/util/configuration/index.js";
import { RabbitMqBoticaClient } from "@/protocol/index.js";

const CONFIG_FILE_PATH = "/run/secrets/botica-config";
const NO_BOTICA_ENVIRONMENT_ERROR = new Error(
  "Not running inside a Botica environment. Are you manually starting this bot? Bots " +
    "should be started inside a container conveniently created by the botica director!",
);

export async function botica(): Promise<Bot> {
  const botType = process.env.BOTICA_BOT_TYPE;
  const botId = process.env.BOTICA_BOT_ID;

  if (!botType || !botId) {
    throw NO_BOTICA_ENVIRONMENT_ERROR;
  }

  const configuration = await loadConfiguration(CONFIG_FILE_PATH);

  const typeConfiguration = configuration.bots[botType!];
  if (!typeConfiguration) {
    throw new Error(`Configuration for bot type '${botType}' not found.`);
  }
  typeConfiguration.id = botType;

  let botConfiguration: BotInstanceConfiguration = {
    ...(typeConfiguration.instances?.[botId] || {}), // may be a generic replica
    ...{ id: botId },
  };

  const boticaClient = buildClient(
    configuration,
    typeConfiguration,
    botConfiguration,
  );

  return new Bot(boticaClient, typeConfiguration, botConfiguration);
}

async function loadConfiguration(path: string): Promise<MainConfiguration> {
  try {
    return await loadConfigurationFile<MainConfiguration>(path);
  } catch (e: any) {
    if (e instanceof Error && e.message.includes("File not found"))
      throw NO_BOTICA_ENVIRONMENT_ERROR;
    throw e;
  }
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

export { Bot };
export * from "./shutdown/ShutdownHandler.js";
export * from "./shutdown/ShutdownRequest.js";
export * from "./shutdown/ShutdownRequestHook.js";
