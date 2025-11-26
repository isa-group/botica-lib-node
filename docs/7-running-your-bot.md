# Running your bot

This document guides you through the process of building and deploying your Botica Node.js bot,
transforming your code into a container image ready to be orchestrated by the Botica Director.

## Bot entry point

Each Botica Node.js bot requires a designated entry point that starts the Botica runtime. This is
typically an `async main()` function (or similar) that calls `botica()` and then `bot.start()`.

```ts
// src/index.js or src/index.ts
import botica from "botica-lib-node";

async function main() {
  const bot = await botica();
  // Configure your bot here (e.g., bot.on(), bot.proactive(), bot.shutdownHandler.onShutdownRequest())
  await bot.start();
}

main().catch(console.error);
```

> [!NOTE]
> Botica bots are designed to run exclusively within a Botica environment, not as standalone
> applications. You cannot simply run your bot's entry point manually. Keep reading to learn how to
> run your bot in a Botica environment.

## Step 1: Building your bot's container image

Regardless of how you set up your project, the first step is always to compile your bot's code (if
using TypeScript) and package it into a Docker container image.

### Option 1: The easy way (using official templates)

**If you started your project with either
the [botica-seed-node](https://github.com/isa-group/botica-seed-node) (for JavaScript) or
the [botica-seed-node-ts](https://github.com/isa-group/botica-seed-node-ts) (for TypeScript)
template**, this process is automated for you.

1. **Customize `package.json`**: Ensure your `package.json` has the correct `imageTag` property (
   e.g., `my-org/my-bot`). This tag identifies your bot's Docker image and must be referenced in
   your Botica environment configuration file to deploy your bot. Also, verify `main` points to your
   bot's entry file.

    - Using the **JavaScript** template:
      ```json
      {
        ...
        "imageTag": "my-org/my-bot",
        "main": "src/index.js",
        "scripts": {
          "start": "node src/index.js"
        },
        ...
      }
      ```

    - Using the **TypeScript** template:
      ```json
      {
        ...
        "imageTag": "my-org/my-bot",
        "main": "dist/src/index.js",
        "scripts": {
          "start": "node dist/src/index.js"
        },
        ...
      }
      ```

2. **Run the build script**: Navigate to your project's root directory in a terminal and execute the
   provided build script.

   #### On Linux or macOS

   ```bash
   ./build.sh
   ```

   #### On Windows

   ```bash
   build.bat
   ```

   This script automatically (if using the TS template) compiles your TypeScript code to JavaScript,
   and then builds a Docker image tagged as specified in your `package.json`.

### Option 2: For existing Node.js projects (without a template)

If you're integrating `botica-lib-node` into an existing Node.js project, you'll need to manually
create a Dockerfile and ensure your build process generates the necessary files.

1. **Ensure a build step (for TypeScript)**: If your project is in TypeScript, make sure your
   `package.json` includes a build script (e.g., `npm run build`) that compiles your `.ts` files to
   `.js` files, typically into a `dist/` folder.

   ```json
   {
     "name": "my-ts-bot",
     "main": "dist/src/index.js",
     "scripts": {
       "build": "tsc -p tsconfig.json",
       "start": "node dist/src/index.js"
     },
     "devDependencies": {
       "typescript": "^5.x.x"
     }
   }
   ```

2. **Create a Dockerfile**: In your project's root directory, create a `Dockerfile` to build your
   bot's container image.

   ```dockerfile
   # Use a Node.js base image (adjust version as needed)
   FROM node:22

   # Set the working directory inside the container
   WORKDIR /app

   # Copy package.json and package-lock.json (if exists)
   COPY package*.json ./

   # Install dependencies
   RUN npm install --omit=dev

   # Copy your application code
   # For JavaScript projects:
   COPY src/ ./src/
   # For TypeScript projects (assuming build output is in dist/):
   # COPY dist/ ./dist/

   # Command to run your bot
   # For JavaScript projects:
   # CMD [ "npm", "start" ] # Or ["node", "src/index.js"]
   # For TypeScript projects (assuming "npm run start" points to dist/):
   CMD [ "npm", "start" ]
   ```

3. **Build the Docker image**: Compile your project (if TypeScript) and then build the Docker image.

   ```bash
   # If using TypeScript, compile your project first
   # npm run build

   # Build the Docker image (replace my-org/my-bot with your desired image tag)
   docker build -t my-org/my-bot .
   ```

   Ensure `my-org/my-bot` matches the image tag you'll use in your Botica environment configuration.

## Step 2: Running the Botica Director

The Botica Director is the orchestrator for your entire Botica environment. It will launch your bot
containers, set up the message broker, and manage inter-bot communication.

1. **Download the appropriate Director program** from
   the [releases page of the Botica repository](https://github.com/isa-group/botica/releases):
    * For Linux/macOS: Download the `botica-director` executable.
    * For Windows: Download the `botica-director.cmd` executable.
2. **Execute the Director**: Run the downloaded program from your terminal.

   ```bash
   # On Linux/macOS
   ./botica-director

   # On Windows
   botica-director.cmd
   ```

   The first time you run the Director in a directory, it will automatically create a default
   `environment.yml` file if one doesn't exist. This is your Botica environment configuration file.

## Step 3: Configure your environment and launch your bot

Now that your bot's Docker image is built, and you have the Botica Director, you need to tell the
Director about your bot.

1. **Open the `environment.yml` file**: This file defines your entire Botica environment.
2. **Add your bot's configuration**: In the `bots` section, define a bot type for your Node.js bot.
   Crucially, specify the `image` field with the Docker image tag you built in Step 1.

   Example `environment.yml` snippet:

   ```yml
   bots:
     my_nodejs_bot_type: # This is your bot type ID
       image: "my-org/my-bot" # **MUST MATCH YOUR DOCKER IMAGE TAG**
       replicas: 1 # Number of instances of this bot type to run
       subscribe:
         - key: "data_channel"
           strategy: distributed
   ```

3. **Run the Botica Director again**: With your `environment.yml` updated, run the Director. It will
   now create the necessary Docker containers, including your Node.js bot, and orchestrate their
   communication.

   ```bash
   # On Linux/macOS
   ./botica-director

   # On Windows
   botica-director.cmd
   ```

   Your Node.js bot will start inside its container, connect to the message broker, and begin
   executing its configured tasks or listening for orders.

[Back to documentation index](0-index.md)
