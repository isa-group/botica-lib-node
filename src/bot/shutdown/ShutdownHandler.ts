import {
  BoticaClient,
  ShutdownRequestPacket,
  ShutdownResponsePacket,
} from "../../protocol/index.js";
import { ShutdownRequestHook } from "./ShutdownRequestHook.js";
import { ShutdownRequest } from "./ShutdownRequest.js";
import logger, { formatError } from "../../logger.js";

export class ShutdownHandler {
  private readonly shutdownRequestHooks: ShutdownRequestHook[] = [];

  constructor(private readonly client: BoticaClient) {
    this.client = client;
    client.registerQueryListener("shutdownRequest", this.onShutdownRequest);
  }

  registerShutdownRequestHook(hook: ShutdownRequestHook) {
    this.shutdownRequestHooks.push(hook);
  }

  private onShutdownRequest = async (packet: ShutdownRequestPacket) => {
    const request = new ShutdownRequest(packet.forced!);

    for (const hook of this.shutdownRequestHooks) {
      try {
        await hook(request);
      } catch (e) {
        logger.error(
          `an exception occurred while executing a shutdown hook: ${formatError(e)}`,
        );
      }
    }
    return new ShutdownResponsePacket(!request.isCanceled);
  };
}
