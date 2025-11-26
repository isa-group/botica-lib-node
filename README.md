# Botica Node.js Library

This library provides the official Node.js (and TypeScript) support for developing bots that run
inside a Botica environment.

## Installation

### Using the official template

If you are starting from scratch, we recommend using one of the official templates to set up your
project:

- [botica-seed-node](https://github.com/isa-group/botica-seed-node): For JavaScript projects.
- [botica-seed-node-ts](https://github.com/isa-group/botica-seed-node-ts): For TypeScript projects.

These templates contain:

- A Node.js project configured for Botica bots
- Scripts for building and packaging your bot:
    - `build.sh` (Linux/macOS)
    - `build.bat` (Windows)
- A Dockerfile preconfigured for Botica environments
- Example bots implemented with the library
- A `package.json` file exposing the `imageTag` property, used by the build scripts

### Using npm

Add the library dependency to your `package.json`:

```json
{
  "dependencies": {
    "botica-lib-node": "~0.6.0"
  }
}
```

As `botica-lib-node` is built with TypeScript, it includes type definitions for seamless integration
into TypeScript projects.

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

> [!NOTE]
> Botica bots are designed to run exclusively within a Botica environment, not as standalone
> applications. You cannot simply run your bot's entry point manually.
>
> Check out [Running your bot](docs/7-running-your-bot.md) in the documentation to learn how to run
> your bot in a Botica environment.

## Further documentation

For a complete overview of `botica-lib-node` features and detailed guides, please refer to the full
documentation:

- **[Read full documentation and detailed guides](docs/0-index.md)**

To understand how bots interact inside a Botica environment, including core platform concepts, refer
to the main Botica documentation:

- **[The concept of a bot](https://github.com/isa-group/botica/blob/main/docs/1-the-concept-of-a-bot.md)**
- **[Creating process chains](https://github.com/isa-group/botica/blob/main/docs/2-process-chains.md)**
- **[Messaging between bots](https://github.com/isa-group/botica/blob/main/docs/3-messaging-between-bots.md)**
- **[Sharing files between bots](https://github.com/isa-group/botica/blob/main/docs/4-sharing-files-between-bots.md)**
- **[The infrastructure configuration file](https://github.com/isa-group/botica/blob/main/docs/the-infrastructure-configuration-file.md)**

## Example projects

Explore these real-world and demonstrative projects built with `botica-lib-node` to see the concepts in action.

- **[Botica Fishbowl infrastructure](https://github.com/isa-group/botica-infrastructure-fishbowl)**:
  A simulation of a 9x9 fishbowl where multiple fish bots move around and a manager bot tracks their
  positions. This project showcases proactive (fish) and reactive (manager) bots written in both
  Node.js and Java, demonstrating inter-language communication and file system interaction.
    - **[Node.js Fish Bot](https://github.com/isa-group/botica-bot-fishbowl-fish-node)**: A
      proactive bot that periodically publishes its position within the fishbowl.


- **[Automatic REST API testing system with RESTest](https://github.com/isa-group/botica-infrastructure-restest)**:
  A real-world application automating REST API testing. Generator bots create test cases, executor
  bots run them, and reporter bots analyze results, demonstrating distributed processing and complex
  workflow orchestration using various Node.js bots.
  - **[RESTest Proxy Bot](https://github.com/isa-group/botica-bot-restest-proxy)**: A specialized
  bot that acts as an intermediary for all requests coming from executor bots. It opens a server
  that proxies incoming requests, forwarding them to the actual destination.


- **[Botica Telegram Frontend Bot](https://github.com/isa-group/botica-bot-telegram-frontend)**:
  A Telegram bot frontend that allows other bots to send information, ask for input, or request
  confirmation from human users via Telegram, demonstrating external service integration.

## License

This project is distributed under the MIT License.
