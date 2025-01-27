import { loadConfigurationFile } from "../util/configuration/index.js";
import fs from "fs";
import {
  BotInstanceConfiguration,
  BotTypeConfiguration,
  MainConfiguration,
} from "../configuration/index.js";
import { RabbitMqBoticaClient } from "../protocol/index.js";
import { Bot } from "./Bot.js";

const CONFIG_FILE_PATH = "/run/secrets/botica-config";

export async function botica(): Promise<Bot> {
  const configuration = await loadConfiguration(CONFIG_FILE_PATH);
  const botType = process.env.BOTICA_BOT_TYPE;
  const botId = process.env.BOTICA_BOT_ID;

  const typeConfiguration = configuration.bots[botType!];
  typeConfiguration.id = botType!;
  const botConfiguration = typeConfiguration.instances[botId!];
  botConfiguration.id = botId!;
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

export { Bot };
