import { ShutdownRequest } from "./ShutdownRequest.js";

/**
 * Function type for handling shutdown requests from the Botica director.
 *
 * This hook is called whenever a shutdown request is received. If the bot is still running a task,
 * it can respond by requesting extra time until the next shutdown request:
 *
 * ```ts
 * bot.shutdownHandler.registerShutdownRequestHook(request => {
 *   if (this.isRunning()) { // some method to check if the bot is still executing a task
 *     request.cancel(); // this will have no effect if request.isForced
 *   }
 * });
 * ```
 *
 * When extra time is requested, the director may send another shutdown request later.
 * This allows bots some grace to finish ongoing tasks, but developers should still avoid
 * very long-running tasks, as these may not be completed within the available time window.
 * The director may ultimately force a shutdown if the bot fails to complete its tasks in time.
 *
 * All registered shutdown hooks will be executed before the response is sent back to the director,
 * so developers should also monitor execution time to prevent unnecessary delays.
 *
 * In the case of a **forced shutdown** {@link ShutdownRequest#isForced}, the response will be
 * ignored, and the director may shut down the container immediately. In this scenario, the hook
 * should be used only to quickly save important data.
 */
export type ShutdownRequestHook = (
  request: ShutdownRequest,
) => void | Promise<void>;
