import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ShutdownHandler,
  ShutdownRequestHook,
  ShutdownResponse,
} from "@/index.js";
import {
  QueryListener,
  ShutdownRequestPacket,
  ShutdownResponsePacket,
} from "@/protocol/index.js";
import { mockBoticaClient } from "@/../tests/mocks/MockBoticaClient.js";

describe("ShutdownHandler", () => {
  let handler: ShutdownHandler;
  let onShutdownRequestCallback: (
    packet: ShutdownRequestPacket,
  ) => Promise<ShutdownResponsePacket>;

  beforeEach(() => {
    handler = new ShutdownHandler(mockBoticaClient);

    onShutdownRequestCallback = mockBoticaClient.registerQueryListener.mock
      .calls[0][1] as QueryListener<
      ShutdownRequestPacket,
      ShutdownResponsePacket
    >;
  });

  it("should register a query listener for 'shutdownRequest' on construction", () => {
    expect(mockBoticaClient.registerQueryListener).toHaveBeenCalledWith(
      "shutdownRequest",
      expect.any(Function),
    );
  });

  it("should return a 'ready' response when no hooks are registered", async () => {
    const requestPacket = new ShutdownRequestPacket(false);
    const responsePacket = await onShutdownRequestCallback(requestPacket);

    expect(responsePacket.ready).toBe(true);
  });

  it("should return a 'ready' response if hooks run but do not cancel", async () => {
    const hook: ShutdownRequestHook = vi.fn(() => {});
    handler.registerShutdownRequestHook(hook);

    const requestPacket = new ShutdownRequestPacket(false);
    const responsePacket = await onShutdownRequestCallback(requestPacket);

    expect(hook).toHaveBeenCalled();
    expect(responsePacket.ready).toBe(true);
  });

  it("should return a 'not ready' (canceled) response if a hook cancels the shutdown", async () => {
    const hook: ShutdownRequestHook = vi.fn((_req, res: ShutdownResponse) => {
      res.setCanceled(true);
    });
    handler.registerShutdownRequestHook(hook);

    const requestPacket = new ShutdownRequestPacket(false);
    const responsePacket = await onShutdownRequestCallback(requestPacket);

    expect(hook).toHaveBeenCalled();
    expect(responsePacket.ready).toBe(false);
  });

  it("should execute all hooks even if one throws an error", async () => {
    const errorHook: ShutdownRequestHook = vi.fn(() => {
      throw new Error("Something went wrong!");
    });
    const successfulHook: ShutdownRequestHook = vi.fn(
      (_req, res: ShutdownResponse) => {
        res.setCanceled(true);
      },
    );

    handler.registerShutdownRequestHook(errorHook);
    handler.registerShutdownRequestHook(successfulHook);

    const requestPacket = new ShutdownRequestPacket(false);
    const responsePacket = await onShutdownRequestCallback(requestPacket);

    expect(errorHook).toHaveBeenCalled();
    expect(successfulHook).toHaveBeenCalled();
    // The successful hook should still have been able to cancel the shutdown
    expect(responsePacket.ready).toBe(false);
  });

  it("should correctly await an asynchronous hook", async () => {
    const asyncHook: ShutdownRequestHook = vi.fn(
      async (_req, res: ShutdownResponse) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        res.setCanceled(true);
      },
    );

    handler.registerShutdownRequestHook(asyncHook);

    const requestPacket = new ShutdownRequestPacket(false);
    const responsePacket = await onShutdownRequestCallback(requestPacket);

    expect(asyncHook).toHaveBeenCalled();
    expect(responsePacket.ready).toBe(false);
  });
});
