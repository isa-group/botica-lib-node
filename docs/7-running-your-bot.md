# Running your bot

This document guides you through the process of building and deploying your Botica Node.js bot,
transforming your code into a container image ready to be orchestrated by the Botica Director.

## Bot entry point

Each Botica Node.js bot requires a designated entry point that starts the Botica runtime. This is
typically a file that calls `botica()` and then `bot.start()`.

```ts
// src/index.js or src/index.ts
import botica from "botica-lib-node";

const bot = await botica();

// Configure your bot here (e.g., bot.on(), bot.proactive(), bot.shutdownHandler.onShutdownRequest())

await bot.start();
```

> [!IMPORTANT]
> Botica bots are designed to run exclusively within a Botica environment, not as standalone
> applications. You cannot simply run your bot's entry point manually. Keep reading to learn how to
> run your bot in a Botica environment.

## How to run your bot

How you run your bot depends on how you have structured your project.

### Option 1: Inside a Botica Project (Recommended)

This is the standard and easiest way to develop with Botica. In this scenario, your bot's source
code resides in a subdirectory within your main Botica project (a "monorepo" structure).

1. **Configure `environment.yml`**: Point the `build` property to your bot's directory.

   ```yaml
   bots:
     my_nodejs_bot:
       build: "./my-bot-directory" # Path to the directory containing the Dockerfile
       replicas: 1
   ```

2. **Run the Director**:

   Execute `./botica-director` on **Linux**/**macOS**, or `botica-director.cmd` on **Windows** in
   your project's directory.

The Director will automatically detect the `build` configuration, build the Docker image from the
source code in `./my-bot-directory`, and launch the container.

### Option 2: Separate Repository (Advanced)

This approach is suitable if you prefer to manage your bot in a completely separate Git repository,
or if you are building a **heavy bot** with complex dependencies, large files, or long compilation
times that you don't want to rebuild frequently.

In this scenario, you must build the Docker image yourself and tell Botica to use that pre-built
image.

1. **Build your bot image**:
   You need to package your bot into a Docker image.

   <details>
   <summary>Using the official template (Easy)</summary>

   If you used one of the official templates (`botica-seed-node` or `botica-seed-node-ts`), the
   `Dockerfile` is already configured for you.

   Simply run the Docker build command from your project root:

   ```bash
   docker build -t my-org/my-bot:latest .
   ```

   Ensure the tag you use (e.g., `my-org/my-bot:latest`) matches what you put in `environment.yml`
   and is defined in your `package.json` (for reference).
   </details>

   <details>
   <summary>Manually (Custom/Existing Projects)</summary>

   If you have a custom setup, you'll need to create a `Dockerfile` and build it manually.

    1. **Create a Dockerfile**:
       ```dockerfile
       FROM node:22
       WORKDIR /app
       COPY package*.json ./
       RUN npm install --omit=dev
       COPY src/ ./src/
       # If using TypeScript, ensure you copy the compiled 'dist/' instead of 'src/'
       CMD [ "npm", "start" ]
       ```

    2. **Build the image**:
       ```bash
       # If using TypeScript, run your build script first (e.g., npm run build)
       docker build -t my-org/heavy-bot .
       ```
   </details>

2. **Configure `environment.yml`**:
   Use the `image` property instead of `build`.

   ```yaml
   bots:
     my_heavy_bot:
       image: "my-org/heavy-bot" # Must match the tag you built
       replicas: 1
       subscribe:
         - key: "data_channel"
           strategy: distributed
   ```

3. **Run the Director**:

   Execute `./botica-director` on **Linux**/**macOS**, or `botica-director.cmd` on **Windows** in
   your project's directory.

The Director will skip the build step and directly use the local Docker image `my-org/heavy-bot`.

[Back to documentation index](0-index.md)
