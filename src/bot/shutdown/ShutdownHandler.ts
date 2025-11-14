import logger, { formatError } from "@/logger.js";
import {
  ShutdownRequest,
  ShutdownRequestHook,
  ShutdownResponse,
} from "@/bot/index.js";
import {
  BoticaClient,
  ShutdownRequestPacket,
  ShutdownResponsePacket,
} from "@/protocol/index.js";

export class ShutdownHandler {
  private readonly shutdownRequestHooks: ShutdownRequestHook[] = [];

  constructor(client: BoticaClient) {
    client.registerQueryListener(
      "shutdownRequest",
      this.processShutdownRequestPacket,
    );
  }

  onShutdownRequest = this.registerShutdownRequestHook;

  registerShutdownRequestHook(hook: ShutdownRequestHook) {
    this.shutdownRequestHooks.push(hook);
  }

  private processShutdownRequestPacket = async (
    packet: ShutdownRequestPacket,
  ) => {
    const request = new ShutdownRequest(packet.forced!);
    const response = new ShutdownResponse();

    for (const hook of this.shutdownRequestHooks) {
      try {
        await hook(request, response);
      } catch (e) {
        logger.error(
          `an exception occurred while executing a shutdown hook: ${formatError(e)}`,
        );
      }
    }

    return new ShutdownResponsePacket(!response.isCanceled);
  };
}
