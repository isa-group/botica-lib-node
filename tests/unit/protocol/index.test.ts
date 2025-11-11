import { describe, expect, it } from "vitest";
import {
  deserializePacket,
  HeartbeatPacket,
  ReadyPacket,
  ShutdownRequestPacket,
  ShutdownResponsePacket,
  BotPacket,
} from "@/protocol/index.js";

describe("deserializePacket()", () => {
  it.each([
    [{ type: "heartbeat" }, HeartbeatPacket],
    [{ type: "ready" }, ReadyPacket],
    [{ type: "shutdownRequest", forced: true }, ShutdownRequestPacket],
    [{ type: "shutdownResponse", ready: false }, ShutdownResponsePacket],
    [{ type: "bot", botId: "b1", packet: { type: "ready" } }, BotPacket],
  ])(
    "should deserialize a valid JSON string into the correct Packet class",
    (packetObject, expectedClass) => {
      const rawJson = JSON.stringify(packetObject);
      const packet = deserializePacket(rawJson);

      expect(packet).toBeInstanceOf(expectedClass);
      expect(packet).toMatchObject(packetObject);
    },
  );

  it("should throw an error for invalid JSON", () => {
    const invalidJson = "{ type: 'heartbeat', ";
    expect(() => deserializePacket(invalidJson)).toThrow(
      "Expected property name or '}' in JSON",
    );
  });

  it("should throw an error if the 'type' property is missing", () => {
    const rawJson = JSON.stringify({ data: "some-data" });
    expect(() => deserializePacket(rawJson)).toThrow(
      "Invalid packet: missing or invalid 'type' property",
    );
  });

  it("should throw an error for an unknown packet type", () => {
    const rawJson = JSON.stringify({ type: "unknown-packet" });
    expect(() => deserializePacket(rawJson)).toThrow(
      "Unknown packet type: unknown-packet",
    );
  });
});
