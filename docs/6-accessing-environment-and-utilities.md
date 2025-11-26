# Accessing environment and utilities

Bots can access crucial runtime information about themselves and the Botica environment. The `Bot`
instance provides several utility properties and methods that allow retrieving the bot's identity,
communicating with other bots, or interacting with the shared file system.

## Accessing bot identity and hostnames

Every bot instance within a Botica environment has a unique identity and runs within its own
container. You can retrieve details about your bot or other bots using the following methods:

- **`bot.id`**: Returns the unique ID of the current bot instance. This ID is assigned by the Botica
  Director and is guaranteed to be unique within the environment.

  ```ts
  import botica from "botica-lib-node";

  async function main() {
    const bot = await botica();

    const myId = bot.id;
    console.log(`My bot ID is: ${myId}`);
  
    await bot.start();
  }

  main().catch(console.error);
  ```

- **`bot.type`**: Returns the ID of the bot type this instance belongs to. A bot type groups
  multiple instances that share the same Docker image and general configuration.

  ```ts
  import botica from "botica-lib-node";

  async function main() {
    const bot = await botica();

    const myType = bot.type;
    console.log(`I am an instance of bot type: ${myType}`);
  
    await bot.start();
  }

  main().catch(console.error);
  ```

- **`bot.hostname`**: Returns the hostname of the Docker container where the current bot instance is
  running. This can be useful for network-related tasks or logging.

  ```ts
  import botica from "botica-lib-node";

  async function main() {
    const bot = await botica();
    await bot.start();

    const myHostname = bot.hostname;
    console.log(`My container hostname is: ${myHostname}`);
  }

  main().catch(console.error);
  ```

- **`bot.getBotHostname(botId)`**: Returns the hostname of the Docker container for a specified bot
  ID. This is particularly useful when you need to establish direct network communication (e.g.,
  HTTP requests) with another specific bot instance.

  ```ts
  import botica from "botica-lib-node";

  async function main() {
    const bot = await botica();
    await bot.start();

    async function connectToAnotherBot(targetBotId) {
      const targetHostname = bot.getBotHostname(targetBotId);
      console.log(`Hostname for bot '${targetBotId}': ${targetHostname}`);
      // Example: use targetHostname to make an HTTP call
      // const response = await fetch(`http://${targetHostname}:8080/api`);
      // const data = await response.json();
      // console.log(`Response from ${targetBotId}:`, data);
    }

    // Example usage:
    // await connectToAnotherBot("another-bot-instance-id");
  }

  main().catch(console.error);
  ```

## Accessing the shared directory

Botica provides a common, shared `/shared` directory mounted across all bot containers in an
environment. This facilitates inter-bot file sharing for large datasets, binaries, or any data not
suitable for message broker payloads.

The `SHARED_DIRECTORY` constant, imported from `botica-lib-node`, provides the absolute path to the
root of the shared directory as a string. You can then use standard Node.js file system (`fs`)
operations to read from or write to this directory.

```ts
import botica, {SHARED_DIRECTORY} from "botica-lib-node";
import {promises as fs} from "fs";
import path from "path";

async function main() {
  const bot = await botica();
  await bot.start();

  const sharedDirPath = SHARED_DIRECTORY; // Use the imported constant
  console.log(`Shared directory path: ${sharedDirPath}`);

  // Example: Write a file to the shared directory
  const myFile = path.join(sharedDirPath, `my-bot-output-${bot.id}.txt`);
  try {
    await fs.writeFile(myFile, `Hello from ${bot.id} at ${new Date().toISOString()}!`);
    console.log(`Wrote to shared file: ${myFile}`);

    // Example: Read from a shared file
    const fileContent = await fs.readFile(myFile, {encoding: 'utf8'});
    console.log(`Read from shared file: ${fileContent}`);

  } catch (e) {
    console.error(`Error accessing shared file: ${e.message}`);
  }
}

main().catch(console.error);
```

[Back to documentation index](0-index.md)
