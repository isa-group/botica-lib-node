import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  Bot,
  BotInstanceConfiguration,
  BotTypeConfiguration,
  ProactiveBotLifecycleConfiguration,
  ReactiveBotLifecycleConfiguration,
} from "@/index.js";
import { ReadyPacket } from "@/protocol/index.js";
import { mockBoticaClient } from "@/../tests/mocks/MockBoticaClient.js";

vi.useFakeTimers();

describe("Bot", () => {
  let bot: Bot;
  let botTypeConfig: BotTypeConfiguration;
  let botInstanceConfig: BotInstanceConfiguration;

  const proactivePeriodicConfig: ProactiveBotLifecycleConfiguration = {
    type: "proactive",
    initialDelay: 1,
    period: 5,
  };

  const proactiveOneShotConfig: ProactiveBotLifecycleConfiguration = {
    type: "proactive",
    initialDelay: 2,
    period: 0,
  };

  const reactiveWithDefaultConfig: ReactiveBotLifecycleConfiguration = {
    type: "reactive",
    defaultAction: "default-test-action",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    botTypeConfig = {
      id: "test-type",
      image: "test-image",
      publish: {
        defaultKey: "default-test-key",
        defaultAction: "default-test-action",
      },
      lifecycle: { type: "reactive" },
      instances: {},
    };

    botInstanceConfig = {
      id: "test-bot-1",
    };
  });

  describe("State Management", () => {
    it("should start the bot, connect the client, and send a ReadyPacket", async () => {
      bot = new Bot(mockBoticaClient, botTypeConfig, botInstanceConfig);
      await bot.start();

      expect(bot.isRunning).toBe(true);
      expect(mockBoticaClient.connect).toHaveBeenCalledTimes(1);
      expect(mockBoticaClient.sendPacket).toHaveBeenCalledWith(
        expect.any(ReadyPacket),
      );
    });

    it("should stop the bot and close the client connection", async () => {
      bot = new Bot(mockBoticaClient, botTypeConfig, botInstanceConfig);
      await bot.start();
      await bot.stop();

      expect(bot.isRunning).toBe(false);
      expect(mockBoticaClient.close).toHaveBeenCalledTimes(1);
    });

    it("should throw an error if start() is called twice", async () => {
      bot = new Bot(mockBoticaClient, botTypeConfig, botInstanceConfig);
      await bot.start();
      await expect(bot.start()).rejects.toThrow("Bot is already running.");
    });

    it("stop() should not throw if called on a stopped bot", async () => {
      bot = new Bot(mockBoticaClient, botTypeConfig, botInstanceConfig);
      await bot.start();
      await bot.stop();
      await expect(bot.stop()).resolves.not.toThrow();
    });
  });

  describe("Proactive Lifecycle", () => {
    it("should schedule and execute a periodic proactive task", async () => {
      botTypeConfig.lifecycle = proactivePeriodicConfig;
      bot = new Bot(mockBoticaClient, botTypeConfig, botInstanceConfig);

      const mockTask: () => void = vi.fn();
      bot.setProactiveTask(mockTask);
      await bot.start();

      expect(mockTask).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(mockTask).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(5000);
      expect(mockTask).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(5000);
      expect(mockTask).toHaveBeenCalledTimes(3);
    });

    it("should execute a one-shot task and then stop the bot", async () => {
      botTypeConfig.lifecycle = proactiveOneShotConfig;
      bot = new Bot(mockBoticaClient, botTypeConfig, botInstanceConfig);

      const mockTask: () => void = vi.fn();
      bot.setProactiveTask(mockTask);
      await bot.start();

      expect(mockTask).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2000);

      expect(mockTask).toHaveBeenCalledTimes(1);
      expect(mockBoticaClient.close).toHaveBeenCalledTimes(1);
      expect(bot.isRunning).toBe(false);
    });

    it("stop() should clear the proactive task interval", async () => {
      botTypeConfig.lifecycle = proactivePeriodicConfig;
      bot = new Bot(mockBoticaClient, botTypeConfig, botInstanceConfig);

      const mockTask: () => void = vi.fn();
      bot.setProactiveTask(mockTask);
      await bot.start();

      vi.advanceTimersByTime(1000);
      expect(mockTask).toHaveBeenCalledTimes(1);

      await bot.stop();

      vi.advanceTimersByTime(10000);
      expect(mockTask).toHaveBeenCalledTimes(1);
    });
  });

  describe("Reactive Lifecycle", () => {
    it("onOrder should register a listener for a specific action", () => {
      bot = new Bot(mockBoticaClient, botTypeConfig, botInstanceConfig);
      const listener: () => void = vi.fn();
      bot.onOrder("my-action", listener);

      expect(mockBoticaClient.registerOrderListener).toHaveBeenCalledWith(
        "my-action",
        listener,
      );
    });

    it("onDefaultOrder should register a listener for the configured default action", () => {
      botInstanceConfig.lifecycle = reactiveWithDefaultConfig;
      bot = new Bot(mockBoticaClient, botTypeConfig, botInstanceConfig);
      const listener: () => void = vi.fn();
      bot.onDefaultOrder(listener);

      expect(mockBoticaClient.registerOrderListener).toHaveBeenCalledWith(
        "default-test-action",
        listener,
      );
    });

    it("onDefaultOrder should throw if no default action is configured", () => {
      bot = new Bot(mockBoticaClient, botTypeConfig, botInstanceConfig);
      const listener: () => void = vi.fn();
      expect(() => bot.onDefaultOrder(listener)).toThrow(
        "No default action specified",
      );
    });
  });

  describe("Publishing Orders", () => {
    beforeEach(() => {
      bot = new Bot(mockBoticaClient, botTypeConfig, botInstanceConfig);
    });

    it("publishDefaultOrder should publish with default key/action", async () => {
      await bot.publishDefaultOrder("raw string");

      expect(mockBoticaClient.publishOrder).toHaveBeenCalledWith(
        "default-test-key",
        "default-test-action",
        "raw string",
      );
    });

    it("should publish with specified key and action", async () => {
      await bot.publishOrder("custom-key", "custom-action", "raw string");

      expect(mockBoticaClient.publishOrder).toHaveBeenCalledWith(
        "custom-key",
        "custom-action",
        "raw string",
      );
    });

    it("should throw if default publish config is missing and no key/action are provided", async () => {
      botTypeConfig.publish = {};
      bot = new Bot(mockBoticaClient, botTypeConfig, botInstanceConfig);

      await expect(bot.publishDefaultOrder("payload")).rejects.toThrow(
        "are not defined",
      );
    });

    it("should stringify payload if not a string", async () => {
      const payload = { data: "test" };
      await bot.publishOrder("custom-key", "custom-action", payload);

      expect(mockBoticaClient.publishOrder).toHaveBeenCalledWith(
        "custom-key",
        "custom-action",
        JSON.stringify(payload),
      );
    });
  });
});
