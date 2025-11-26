# Listening to orders from other bots

In Botica, your bot's subscriptions to order *keys* are defined in the environment configuration
file, not in your bot's code. This means that at runtime, your bot is already configured to receive
orders from specific keys. Your bot's role, then, is to define *listeners* that react to the
*actions* specified within those incoming orders. When an order arrives from any of its subscribed
keys, Botica will execute the appropriate listener bound to that order's action.

## Registering order listeners

You can register order listeners within your bot's main function or any method where the `bot`
instance is available.

The `bot.on(action, listener)` or `bot.registerOrderListener(action, listener)` methods bind a
functional listener to a specified action.

```ts
import botica from "botica-lib-node";

async function main() {
  const bot = await botica();

  bot.on("process_data", async (payload) => {
    console.log(`Processing data: ${payload}`);
    const processedResult = process(payload);
    await bot.publishOrder("results_key", "store_processed_results", processedResult);
  });

  await bot.start();
}

function process(data) {
  return data.toUpperCase(); // Example processing
}

main().catch(console.error);
```

If the payload is a JSON string, you will need to parse it yourself within the listener:

```ts
import botica from "botica-lib-node";

async function main() {
  const bot = await botica();

  bot.on("json_data", async (rawPayload) => {
    try {
      const payload = JSON.parse(rawPayload);
      console.log(`Received JSON data'. ID: ${payload.id}`);
      const status = processJson(payload);
      await bot.publishOrder("json_results", "report_status", {status: status});
    } catch (e) {
      console.error(`Failed to parse JSON payload: ${rawPayload}`, e);
    }
  });

  await bot.start();
}

function processJson(json) {
  // Example: Read a field and return a status
  return json.value ? `processed-${json.value}` : "processed-no-value";
}

main().catch(console.error);
```

### Registering default order listener

If your bot has a `defaultAction` defined in its environment configuration, you can register a
listener for it using `bot.onDefaultOrder(listener)` or
`bot.registerDefaultOrderListener(listener)`.

Example environment configuration:

```yml
bots:
  my_reactive_bot_type:
    image: "my_org/my_reactive_bot_image"
    lifecycle:
      type: reactive
      defaultAction: "start_processing" # This is the default action
    # ... other configurations
```

Then, in your bot's code:

```ts
import botica from "botica-lib-node";

async function main() {
  const bot = await botica();

  bot.onDefaultOrder(async (payload) => {
    console.log(`Received default action payload: ${payload}`);
    const response = createDefaultResponse(payload);
    await bot.publishOrder("response_key", "default_response", response);
  });

  await bot.start();
}

function createDefaultResponse(input) {
  return `Default response for: ${input}`;
}

main().catch(console.error);
```

[Back to documentation index](0-index.md)
