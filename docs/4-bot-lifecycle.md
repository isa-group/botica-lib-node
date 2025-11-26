# Bot lifecycle

A Botica Node.js bot follows a straightforward lifecycle, starting from its initialization to its
operational state and eventual shutdown. This process ensures the bot is properly configured,
connected, and ready to perform its tasks within the Botica environment.

The general flow is as follows:

1. **Initialization**: Your bot's entry point calls the `botica()` function. This function loads the
   bot's runtime configuration (ID, type, broker settings, etc.) from the environment, provided by
   the Botica Director, and returns a `Bot` instance.
2. **Configuration**: After obtaining the `Bot` instance, you define your bot's behavior. This
   includes registering order listeners (`bot.on()`), setting a proactive task (`bot.proactive()`),
   and defining shutdown request hooks (`bot.shutdownHandler.onShutdownRequest()`). This phase must
   be completed *before* calling `bot.start()`.
3. **Startup**: The `bot.start()` method is called. This establishes a connection to the message
   broker, sets up necessary communication channels with the Botica Director, and signals its
   readiness. The promise returned by `bot.start()` resolves once the bot is fully operational and
   connected.
4. **Runtime**: The bot actively processes incoming orders through its registered listeners and/or
   executes its proactive task according to its configured schedule.
5. **Shutdown**: The `bot.stop()` method is called (either programmatically within the bot or in
   response to a shutdown request from the Botica Director). This method initiates a graceful
   shutdown, executing any registered shutdown hooks and closing the connection to the message
   broker.

## Lifecycle phases

### Configuration

This phase occurs after the `botica()` function returns a `Bot` instance and before `bot.start()` is
called. It's the primary stage for setting up your bot's logic and reactions.

Here, you register all handlers for incoming orders, define your bot's proactive behavior, and set
up hooks for graceful shutdown. It's crucial that all these definitions are made during this phase,
as changing them after `bot.start()` might lead to unexpected behavior or errors.

```ts
import botica from "botica-lib-node";

async function main() {
  const bot = await botica();
  console.log("Bot is initializing and configuring...");

  // Register an order listener
  bot.on("setup_action", async (payload, action) => {
    console.log(`Received setup action during configuration: ${action}, payload: ${payload}`);
  });

  // Register a proactive task if the bot is configured as proactive
  bot.proactive(async () => {
    console.log("Proactive task running...");
    await bot.publishOrder("system_events", "proactive_ping", "active");
  });

  // Register a shutdown hook
  bot.shutdownHandler.onShutdownRequest(async () => {
    console.log("Bot is preparing for shutdown during configuration...");
    // Perform light cleanup here if needed before bot.start() completes
  });

  await bot.start();
  // The bot is now fully operational
}

main().catch(console.error);
```

### Startup

The `bot.start()` method initiates the bot's connection to the Botica environment. The `Promise`
returned by `bot.start()` resolves once the bot has successfully connected to the message broker and
is ready to send and receive orders. This is the ideal point for any logic that requires the bot to
be fully operational.

```ts
import botica from "botica-lib-node";

async function main() {
  const bot = await botica();
  // ... configuration logic ...

  await bot.start();
  console.log("Bot has started and is connected.");

  // Publish an initial order to signal readiness or request data
  await bot.publishOrder("system_events", "bot_ready", bot.hostname);
}

main().catch(console.error);
```

### Shutdown

Your bot can gracefully respond to shutdown requests initiated by the Botica Director. You can
define a function to react to these requests using `bot.shutdownHandler.onShutdownRequest()`. This
allows your bot to perform cleanup tasks or even attempt to delay its termination if it's currently
busy (and the shutdown isn't forced).

```ts
import botica from "botica-lib-node";

async function main() {
  const bot = await botica();

  bot.shutdownHandler.onShutdownRequest(async () => {
    console.log("Bot is receiving a shutdown request. Performing cleanup...");
    // Perform cleanup like saving state or closing resources.
    // For more advanced handling, including conditional cancellation,
    // refer to the "Handling shutdown requests" documentation.
    await saveCurrentState();
  });

  await bot.start();
}

async function saveCurrentState() {
  // Simulate saving data
  console.log("Saving current state...");
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("State saved.");
}

main().catch(console.error);
```

For detailed explanations on shutdown request hooks, like canceling a shutdown, please refer to
the [Handling shutdown requests](5-handling-shutdown-requests.md) documentation.

[Back to documentation index](0-index.md)
