import { bot } from "./bot";

async function main() {
  const app = await bot();

  app.setProactiveAction(() => {});
  await app.start();
}
