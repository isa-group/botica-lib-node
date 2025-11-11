import { beforeEach, describe, expect, it, Mocked, vi } from "vitest";
import { BotPacket, RabbitMqBoticaClient } from "@/protocol/index.js";
import {
  BotInstanceConfiguration,
  BotTypeConfiguration,
  MainConfiguration,
  RabbitMqConfiguration,
} from "@/configuration/index.js";
import { connect, RabbitMqClient } from "@/rabbitmq/index.js";
import { createMockRabbitMqClient } from "../../mocks/MockRabbitMqClient.js";

vi.mock("@/rabbitmq/index.js");

let mockRabbitMqClient: Mocked<RabbitMqClient>;

describe("RabbitMqBoticaClient", () => {
  let client: RabbitMqBoticaClient;
  let mainConfig: MainConfiguration;
  let typeConfig: BotTypeConfiguration;
  let botConfig: BotInstanceConfiguration;

  beforeEach(() => {
    mockRabbitMqClient = createMockRabbitMqClient();
    vi.mocked(connect).mockResolvedValue(mockRabbitMqClient);

    const brokerConfig: RabbitMqConfiguration = {
      type: "rabbitmq",
      username: "username",
      password: "password",
    };
    mainConfig = {
      broker: brokerConfig,
      bots: {},
    };
    typeConfig = {
      id: "test-type",
      image: "img",
      instances: {},
      subscribe: [{ key: "sub-key", strategy: "distributed" }],
    };
    botConfig = { id: "bot-1" };

    client = new RabbitMqBoticaClient(mainConfig, typeConfig, botConfig);
  });

  describe("Connection", () => {
    it("should connect and set up protocol queues and listeners", async () => {
      await client.connect();

      expect(connect).toHaveBeenCalledWith(
        "username",
        "password",
        "botica-rabbitmq",
      );

      expect(mockRabbitMqClient.createQueue).toHaveBeenCalledWith(
        "bot.bot-1.protocol",
      );
      expect(mockRabbitMqClient.bind).toHaveBeenCalledWith(
        "botica.protocol",
        "bot.bot-1.protocol",
        "bot.bot-1.protocol",
      );
      expect(mockRabbitMqClient.subscribe).toHaveBeenCalledWith(
        "bot.bot-1.protocol",
        expect.any(Function),
      );
    });

    it("should set up order queues and listeners based on config", async () => {
      await client.connect();

      expect(mockRabbitMqClient.subscribe).toHaveBeenCalledWith(
        "bot_type.test-type.orders.distributed",
        expect.any(Function),
      );

      expect(mockRabbitMqClient.createQueue).toHaveBeenCalledWith(
        "bot.bot-1.orders",
      );
      expect(mockRabbitMqClient.bind).toHaveBeenCalledWith(
        "botica.order",
        "bot.bot-1.orders",
        "bot.bot-1.orders",
      );
      expect(mockRabbitMqClient.subscribe).toHaveBeenCalledWith(
        "bot.bot-1.orders",
        expect.any(Function),
      );
    });

    it("should throw an error if already connected", async () => {
      await client.connect();
      await expect(client.connect()).rejects.toThrow("Already connected");
    });

    it("should close the connection", async () => {
      await client.connect();
      await client.close();
      expect(mockRabbitMqClient.closeConnection).toHaveBeenCalledTimes(1);
    });
  });

  describe("Publishing", () => {
    beforeEach(async () => {
      await client.connect();
    });

    it("publishOrder should publish a correctly formatted message", async () => {
      const payload = { data: 123 };
      await client.publishOrder("my-key", "my-action", JSON.stringify(payload));

      const expectedMessage = JSON.stringify({
        action: "my-action",
        payload: JSON.stringify(payload),
      });

      expect(mockRabbitMqClient.publish).toHaveBeenCalledWith(
        "botica.order",
        "my-key",
        expectedMessage,
      );
    });

    it("sendPacket should wrap the packet in BotPacket and publish", async () => {
      const innerPacket = { type: "ready" };
      await client.sendPacket(innerPacket);

      const expectedWrapper = new BotPacket("bot-1", innerPacket);
      const expectedMessage = JSON.stringify(expectedWrapper);

      expect(mockRabbitMqClient.publish).toHaveBeenCalledWith(
        "botica.protocol",
        "director.protocol",
        expectedMessage,
      );
    });

    it("should throw if not connected when publishing an order", async () => {
      client = new RabbitMqBoticaClient(mainConfig, typeConfig, botConfig);
      await expect(
        client.publishOrder("key", "action", "payload"),
      ).rejects.toThrow("Client is not connected yet!");
    });

    it("should throw if not connected when sending a packet", async () => {
      client = new RabbitMqBoticaClient(mainConfig, typeConfig, botConfig);
      await expect(client.sendPacket({ type: "ready" } as any)).rejects.toThrow(
        "Client is not connected yet!",
      );
    });
  });

  describe("Listeners", () => {
    it("should call a registered order listener when a message is received", async () => {
      const listener = vi.fn();
      client.registerOrderListener("test-action", listener);

      await client.connect();

      // Find the subscribe callback for the bot's own queue
      const subscribeCall = mockRabbitMqClient.subscribe.mock.calls.find(
        (call) => call[0] === "bot.bot-1.orders",
      );
      const messageHandler = subscribeCall![1];

      const payload = { success: true };
      const brokerMessage = JSON.stringify({
        action: "test-action",
        payload: payload,
      });
      messageHandler(brokerMessage);

      expect(listener).toHaveBeenCalledWith(payload, "test-action");
    });

    it("should isolate errors in order listeners", async () => {
      const failingListener = vi.fn(() => {
        throw new Error("Order processing error");
      });
      const successfulListener = vi.fn();

      client.registerOrderListener("error-action", failingListener);
      client.registerOrderListener("error-action", successfulListener);

      await client.connect();

      const subscribeCall = mockRabbitMqClient.subscribe.mock.calls.find(
        (call) => call[0] === "bot.bot-1.orders",
      );
      const messageHandler = subscribeCall![1];

      const payload = { data: "test" };
      const brokerMessage = JSON.stringify({
        action: "error-action",
        payload: payload,
      });
      messageHandler(brokerMessage);

      expect(failingListener).toHaveBeenCalledWith(payload, "error-action");
      expect(successfulListener).toHaveBeenCalledWith(payload, "error-action");
    });

    it("should call a registered packet listener when a packet is received", async () => {
      const packetListener = vi.fn();
      client.registerPacketListener("heartbeat", packetListener);

      await client.connect();

      const subscribeCall = mockRabbitMqClient.subscribe.mock.calls.find(
        (call) => call[0] === "bot.bot-1.protocol",
      );
      expect(subscribeCall).toBeDefined();
      const packetHandler = subscribeCall![1];

      const heartbeatPacket = { type: "heartbeat" };
      const rawPacket = JSON.stringify(heartbeatPacket);
      packetHandler(rawPacket);

      expect(packetListener).toHaveBeenCalledWith(
        expect.objectContaining(heartbeatPacket),
      );
    });

    it("should isolate errors in packet listeners", async () => {
      const failingPacketListener = vi.fn(() => {
        throw new Error("Packet processing error");
      });
      const successfulPacketListener = vi.fn();

      client.registerPacketListener("heartbeat", failingPacketListener);
      client.registerPacketListener("heartbeat", successfulPacketListener);

      await client.connect();

      const subscribeCall = mockRabbitMqClient.subscribe.mock.calls.find(
        (call) => call[0] === "bot.bot-1.protocol",
      );
      const packetHandler = subscribeCall![1];

      const rawPacket = JSON.stringify({ type: "heartbeat" });
      packetHandler(rawPacket);

      expect(failingPacketListener).toHaveBeenCalledTimes(1);
      expect(successfulPacketListener).toHaveBeenCalledTimes(1);
    });
  });
});
