# Proactive bots

Proactive bots represent a design pattern for bots that execute work automatically, primarily on a
scheduled basis, without requiring explicit external interaction like an incoming order. Botica
provides native support for this pattern, abstracting away the complexities of schedulers, thread
management, and configuration. This allows developers to easily implement bots that, for example,
generate data periodically, initiate process chains by publishing orders, or perform routine
maintenance tasks, without hardcoding delay or period values.

## Configuration in the environment file

The execution schedule of a proactive bot's task is defined in the bot's lifecycle configuration
within your Botica environment file. This centralizes scheduling configuration and avoids hardcoding
it within your bot's code.

Example configuration for a proactive bot:

```yml
bots:
  my_proactive_bot_type:
    image: "my_org/my_proactive_bot_image"
    lifecycle:
      type: proactive
      initialDelay: 5      # (Optional) Time in seconds before the first execution. Defaults to 0.
      period: 60           # (Optional) Time in seconds between executions. Defaults to 1.
    # ... other configurations
```

- **`type: proactive`**: This is a mandatory setting that identifies the bot type as proactive,
  enabling the execution of its proactive task. If this is not set, a proactive task defined in the
  bot will not execute.
- **`initialDelay`**: Specifies the time in seconds to wait before the first execution of the
  proactive task. It defaults to `0` if not specified.
- **`period`**: Defines the interval in seconds between repeated executions of the task.
    - If `period` is a positive value (e.g., `60`), the task will execute repeatedly every `60`
      seconds after its `initialDelay`.
    - If `period` is set to `-1`, the task will execute only once after its `initialDelay`.
      Following this single execution, the bot will automatically shut down if there are no other
      active user threads.

## Defining a proactive task

Once the bot type is configured as `proactive` in the environment file, you can define the actual
task within your bot's implementation using the `bot.proactive()` method.

The `bot.proactive(task)` method accepts a function that will be executed according to the timing
configuration in your environment file.

```ts
import botica from "botica-lib-node";
import {randomUUID} from "crypto";

async function main() {
  const bot = await botica();

  bot.proactive(async () => {
    console.log("Executing proactive data generation...");
    const generatedData = createRandomData();
    await bot.publishOrder("raw_data", "process_generated_data", generatedData);
  });

  await bot.start();
}

function createRandomData() {
  return `{ "id": "${randomUUID()}", "timestamp": "${new Date().toISOString()}" }`;
}

main().catch(console.error);
```

Only **one** proactive task can be registered per bot instance. Attempting to register multiple
tasks will result in an error. The task function must not accept any parameters.

Proactive bots can still listen for and respond to incoming orders (making them suitable for
mixed-initiative workflows).

## Best practices for proactive bots

- **Single Responsibility**: A proactive bot's primary role is often to initiate work. If its
  proactive task involves extensive processing, consider if the work can be split into smaller,
  independent tasks. These can then be delegated to reactive bots by publishing orders, potentially
  allowing for parallelization and better resource utilization.
- **Resource Utilization**: Be mindful of the `period` setting. Very frequent tasks might consume
  excessive resources. Adjust the timing based on the actual needs of the workflow.

[Back to documentation index](0-index.md)
