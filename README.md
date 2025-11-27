# Botica Node.js Library

This library provides the official Node.js (and TypeScript) support for developing bots that run
inside a [Botica](https://github.com/isa-group/botica) environment.

## Installation

### Using the official template (recommended)

If you are starting from scratch, we recommend using one of the official templates to set up your
project:

- [botica-seed-node](https://github.com/isa-group/botica-seed-node): For JavaScript projects.
- [botica-seed-node-ts](https://github.com/isa-group/botica-seed-node-ts): For TypeScript projects.

These templates contain a Node.js project configured for Botica bots, and scripts for building and
packaging your bot for both Windows and Linux/macOS, among others.

### Using npm

Install `botica-lib-node` as a dependency by running:

```
npm install botica-lib-node
```

Or add it to your `package.json` manually and run `npm install` afterward:

```json
{
  "dependencies": {
    "botica-lib-node": "~0.6.0"
  }
}
```

As `botica-lib-node` is built with TypeScript, it includes type definitions for seamless integration
into TypeScript projects.

> [!TIP]
> We **really encourage** creating your bot's repository **using the official template**. It
> contains build scripts that simplify the entire build process of your bot into a single step, from
> compilation to Docker image creation.

## Creating your first bot

To implement a bot, you will interact with the `Bot` instance obtained from the `botica()` function
and define its behavior using its provided methods.

### Example: reactive bot

This bot registers an order listener for `process_data` actions programmatically within its main
function.

```ts
import botica from "botica-lib-node";

async function main() {
  const bot = await botica();

  bot.on("process_data", async (payload) => {
    console.log("Processing data: " + payload);
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

### Example: proactive bot

This bot defines a proactive task using the `proactive()` method, which will run periodically as
configured in the environment file.

```ts
import botica from "botica-lib-node";

async function main() {
  const bot = await botica();

  bot.proactive(async () => {
    await bot.publishOrder("raw_data", "process_data", "sample");
  });

  await bot.start();
}

main().catch(console.error);
```

## Entry point

Each bot requires an entry point that starts the Botica runtime. The `botica()` function establishes
the connection with the Botica Director and initializes your bot.

```ts
import botica from "botica-lib-node";

async function main() {
  const bot = await botica();
  // Configure your bot here
  await bot.start();
}

main().catch(console.error);
```

> [!IMPORTANT]
> Botica bots are designed to run exclusively within a Botica environment, not as standalone
> applications. You cannot simply run your bot's entry point manually.
>
> Check out [Running your bot](docs/7-running-your-bot.md) in the documentation to learn how to run
> your bot in a Botica environment.

## Further documentation

For a complete overview of `botica-lib-node` features and detailed guides, please refer to the full
documentation:

### [Read full documentation, detailed guides and example projects](docs/0-index.md)

## License

This project is distributed under the MIT License.
