# Publishing orders

Publishing orders is a fundamental way for bots to initiate actions and share data. Bots publish
orders through the `bot.publishOrder(key, action, payload)` method:

```ts
import botica from "botica-lib-node";

async function main() {
  const bot = await botica();

  bot.proactive(async () => {
    const message = `Hello from my bot at ${new Date().toISOString()}`;
    // You can send whole objects too, not just strings, see below
    await bot.publishOrder("log_key", "system_message", message);
    console.log(`Published message: ${message}`);
  });

  await bot.start();
}

main().catch(console.error);
```

An order always consists of 3 different parts:

- **Key**: A broker-level concept that determines which bots will receive the order based on their
  subscriptions defined in the environment file.
- **Action**: A bot-level concept used by receiving bots to route the order to a specific handler or
  listener.
- **Payload**: The actual data being sent. It can be any JavaScript `Object` or `String`.

When you publish an order, the `payload` is automatically serialized into a `String` before being
sent to the message broker:

- **`String` payloads**: The `String` object is sent directly without any modification.
- **Any other JavaScript type (e.g., `Object`, `Array`, `Number`, `Boolean`)**: The library
  automatically converts the object into its JSON string representation using `JSON.stringify()`.
  This means you can easily publish complex JavaScript objects, and they will be automatically
  converted to their JSON string equivalent.

  ```ts
  import botica from "botica-lib-node";

  async function main() {
    const bot = await botica();

    bot.proactive(async () => {
      // Define a custom object for outgoing data
      const data = {
        sensorId: "sensor-101",
        value: Math.random() * 100,
        timestamp: new Date().toISOString(),
      };
      await bot.publishOrder("measurements_key", "record_measurement", data);
    });

    await bot.start();
  }

  main().catch(console.error);
  ```

### Publishing orders with defaults

To streamline development, you can configure default keys and actions in your bot's environment
file. This allows you to publish orders without explicitly specifying these details every time.

Example environment configuration for publish defaults:

```yml
bots:
  my_producer_bot_type:
    image: "my_org/my_producer_bot_image"
    publish:
      defaultKey: "default_output"
      defaultAction: "log_event"
    # ... other configurations
```

With these defaults configured, you can use the `bot.publishDefaultOrder(payload)` method.

```ts
import botica from "botica-lib-node";

async function main() {
  const bot = await botica();

  bot.proactive(async () => {
    const eventPayload = `Event from ${bot.hostname} at ${new Date().toISOString()}`;
    // Publishes using 'default_output' key and 'log_event' action
    await bot.publishDefaultOrder(eventPayload);
    console.log(`Published default event: ${eventPayload}`);
  });

  await bot.start();
}

main().catch(console.error);
```

This method will automatically use the `defaultKey` and `defaultAction` defined in your bot's
environment configuration. If no defaults are configured, calling this method will throw an `Error`.

[Back to documentation index](0-index.md)
