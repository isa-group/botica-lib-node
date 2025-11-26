# Botica Node.js Library Documentation

Welcome to the comprehensive documentation for the `botica-lib-node` library. This guide provides
detailed information on developing powerful, scalable bots for the Botica multi-agent platform using
Node.js.

## Core Concepts and API Reference

These documents delve into the primary features and API of the `botica-lib-node` library, guiding
you through the implementation of various bot behaviors.

1. **[Listening to orders from other bots](1-listening-to-orders.md)**: Learn how to make your bots
   reactive by defining handlers for incoming orders.
2. **[Proactive bots](2-proactive-bots.md)**: Discover how to implement bots that initiate tasks
   automatically on a schedule.
3. **[Publishing orders](3-publishing-orders.md)**: Learn how to send orders to other bots.
4. **[Bot lifecycle](4-bot-lifecycle.md)**: Understand the complete lifecycle of a Botica Node.js
   bot and the related events like `configure()` and `onStart()`.
5. **[Handling shutdown requests from the Director](5-handling-shutdown-requests.md)**: Learn how to
   manage bot termination gracefully, performing cleanup and potentially delaying shutdown.
6. **[Accessing environment and utilities](6-accessing-environment-and-utilities.md)**: Find out how
   to retrieve essential runtime information (bot ID, hostname) and utilize shared resources like
   the shared directory.
7. **[Running your bot](7-running-your-bot.md)**: A step-by-step guide to building your bot into a
   Docker image and deploying it within a Botica environment using the Botica Director.

## Botica Platform Documentation

For a deeper understanding of the overall Botica platform, including concepts like the environment
configuration file, message routing strategies, and inter-bot communication paradigms, please refer
to the main Botica documentation:

- **[The concept of a bot](https://github.com/isa-group/botica/blob/main/docs/1-the-concept-of-a-bot.md)**
- **[Creating process chains](https://github.com/isa-group/botica/blob/main/docs/2-process-chains.md)**
- **[Messaging between bots](https://github.com/isa-group/botica/blob/main/docs/3-messaging-between-bots.md)**
- **[Sharing files between bots](https://github.com/isa-group/botica/blob/main/docs/4-sharing-files-between-bots.md)**
- **[The infrastructure configuration file](https://github.com/isa-group/botica/blob/main/docs/the-infrastructure-configuration-file.md)**

## Example Projects

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
