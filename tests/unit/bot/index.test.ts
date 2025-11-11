import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { botica, MainConfiguration } from "@/index.js";
import { Bot } from "@/bot/Bot.js";
import * as configLoader from "@/util/configuration/index.js";

vi.mock("@/util/configuration/index.js");

const mockLoadConfigurationFile = vi.mocked(configLoader.loadConfigurationFile);

describe("botica() factory function", () => {
  const originalEnv = process.env;
  const mockConfig: MainConfiguration = {
    broker: { type: "rabbitmq" },
    bots: {
      "my-bot-type": {
        id: "my-bot-type",
        image: "image",
        instances: {
          "my-bot-instance": {
            id: "my-bot-instance",
          },
        },
      },
    },
  };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should successfully create a Bot instance when config and env are valid", async () => {
    process.env.BOTICA_BOT_TYPE = "my-bot-type";
    process.env.BOTICA_BOT_ID = "my-bot-instance";
    mockLoadConfigurationFile.mockResolvedValue(mockConfig);

    const bot = await botica();

    expect(bot).toBeInstanceOf(Bot);
    expect(mockLoadConfigurationFile).toHaveBeenCalledTimes(1);
  });

  it("should throw an error if BOTICA_BOT_TYPE is missing", async () => {
    process.env.BOTICA_BOT_ID = "my-bot-instance";
    delete process.env.BOTICA_BOT_TYPE;

    await expect(botica()).rejects.toThrow(
      "Not running inside a Botica environment",
    );
  });

  it("should throw an error if BOTICA_BOT_ID is missing", async () => {
    process.env.BOTICA_BOT_TYPE = "my-bot-type";
    delete process.env.BOTICA_BOT_ID;

    await expect(botica()).rejects.toThrow(
      "Not running inside a Botica environment",
    );
  });

  it("should throw an error if the bot type from env is not in the config file", async () => {
    process.env.BOTICA_BOT_TYPE = "non-existent-type";
    process.env.BOTICA_BOT_ID = "my-bot-instance";
    mockLoadConfigurationFile.mockResolvedValue(mockConfig);

    await expect(botica()).rejects.toThrow(
      "Configuration for bot type 'non-existent-type' not found.",
    );
  });

  it("should propagate errors from the configuration loader", async () => {
    process.env.BOTICA_BOT_TYPE = "my-bot-type";
    process.env.BOTICA_BOT_ID = "my-bot-instance";
    const loadError = new Error("Unsupported configuration file extension");
    mockLoadConfigurationFile.mockRejectedValue(loadError);

    await expect(botica()).rejects.toThrow(
      "Unsupported configuration file extension",
    );
  });
});
