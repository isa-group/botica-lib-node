# Botica Node.js Library

This library provides the official Node.js (and TypeScript) support for developing bots that run
inside a [Botica](https://github.com/isa-group/botica) environment.

## Installation

### With botica-director

The easiest way to start is by using the `botica-director` CLI to initialize a new bot directly
inside your Botica project. This sets up the directory structure, Dockerfile, and build
configuration automatically.

```bash
# On Linux/macOS
./botica-director init <typescript/javascript> my-bot-name

# On Windows
botica-director.cmd init <typescript/javascript> my-bot-name
```

### Using the official template

If you prefer to maintain your bot in a separate repository, you can use one of the official
templates to set up your project:

- [botica-seed-node](https://github.com/isa-group/botica-seed-node): For JavaScript projects.
- [botica-seed-node-ts](https://github.com/isa-group/botica-seed-node-ts): For TypeScript projects.

### Using npm

Add the library dependency to your `package.json`:

```bash
npm install botica-lib-node
```

As `botica-lib-node` is built with TypeScript, it includes type definitions for seamless integration
into TypeScript projects.

> [!TIP]
> We **really encourage** creating your bot's repository **using botica-director or the official
> template**. They provide the necessary structure and Dockerfile to easily build and run your bot
> within a Botica environment.

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
