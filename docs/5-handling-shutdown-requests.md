# Handling shutdown requests from the Director

Your Botica bot can gracefully respond to shutdown requests initiated by the Botica Director. Proper
shutdown handling allows your bot to perform critical cleanup, save its state, or even attempt to
delay its termination if necessary.

## Understanding shutdown requests

The Botica Director manages the lifecycle of all bots, including their shutdown. When the Director
decides to terminate a bot container, it sends a shutdown request. This request can be either:

- **Graceful**: The Director requests the bot to shut down, allowing it a limited time to respond
  and complete any critical tasks. The bot can potentially *cancel* this type of shutdown if it's
  currently busy.
- **Forced**: The Director mandates immediate termination. In this scenario, any attempt to cancel
  the shutdown will be ignored, and the bot should prioritize quick, essential cleanup.

## Registering a shutdown handler

You can define a function in your bot's implementation and register it with
`bot.shutdownHandler.onShutdownRequest(hook)` to automatically handle incoming shutdown requests.

### Simple cleanup

A basic shutdown request hook can be defined with no parameters to the hook function, or by simply
ignoring them. This is suitable for straightforward cleanup tasks that don't need information about
the request or to influence the shutdown decision.

```ts
import botica from "botica-lib-node";

async function main() {
  const bot = await botica();

  bot.shutdownHandler.onShutdownRequest(async () => {
    console.log("Bot is receiving a shutdown request. Performing final cleanup...");
    // Perform cleanup like saving ephemeral state or closing local resources.
    await clearTemporaryFiles();
  });

  await bot.start();
}

async function clearTemporaryFiles() {
  console.log("Clearing temporary files...");
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log("Temporary files cleared.");
}

main().catch(console.error);
```

### Accessing the request and controlling the response

Your shutdown request hook can also accept a `ShutdownRequest` object and a `ShutdownResponse`
object as parameters.

When you define the hook to accept a `ShutdownRequest` parameter, Botica will inject an object
containing details about the shutdown (e.g., if it's forced). This allows you to perform conditional
cleanup or logging based on the nature of the request.

```ts
import botica from "botica-lib-node";

async function main() {
  const bot = await botica();

  bot.shutdownHandler.onShutdownRequest(async (request) => {
    if (request.isForced) {
      console.log("Forced shutdown detected. Saving critical data quickly.");
      await saveCriticalData();
    } else {
      console.log("Normal shutdown. Cleaning up everything.");
      await performFullCleanup();
    }
  });

  await bot.start();
}

async function saveCriticalData() {
  console.log("Saving critical data...");
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log("Critical data saved.");
}

async function performFullCleanup() {
  console.log("Performing full cleanup...");
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("Full cleanup done.");
}

main().catch(console.error);
```

By modifying the `ShutdownResponse` object, your bot can signal its readiness to shut down or
attempt to cancel the request. If your bot is currently executing a critical task and the shutdown
is *not forced*, setting `response.setCanceled(true)` can request the Director to delay the
shutdown.

```ts
import botica from "botica-lib-node";

async function main() {
  const bot = await botica();
  let isBusy = true; // Assume this state changes based on bot's work

  // Simulate work changing busy state
  setInterval(() => {
    isBusy = !isBusy;
    console.log(`Bot busy state: ${isBusy}`);
  }, 5000);

  bot.shutdownHandler.onShutdownRequest(async (request, response) => {
    if (request.isForced || !isBusy) {
      console.log("Shutting down gracefully.");
      await saveAllState();
      // response is implicitly ready if not canceled
    } else {
      console.log("Still busy, attempting to cancel shutdown.");
      response.setCanceled(true); // Requests to cancel the shutdown. May be ignored if forced.
    }
  });

  await bot.start();
}

async function saveAllState() {
  console.log("Saving all state...");
  await new Promise(resolve => setTimeout(resolve, 800));
  console.log("All state saved.");
}

main().catch(console.error);
```

## Important considerations

- **Forced Shutdowns**: When `ShutdownRequest.isForced` is `true`, any attempt to cancel the
  shutdown via `response.setCanceled(true)` will be ignored. Your bot should prioritize immediate,
  critical data saving in this scenario.
- **Timeliness**: Even if a shutdown is not forced, the Director has a timeout for bot responses.
  Ensure your cleanup logic is efficient to avoid the Director forcibly terminating your container
  if it takes too long to respond.
- **Multiple Hooks**: If multiple `ShutdownRequestHook`s are registered, they will all be executed.
  If any hook requests cancellation (`response.setCanceled(true)`), the overall response will be a
  cancellation attempt (unless the shutdown is forced).

[Back to documentation index](0-index.md)
