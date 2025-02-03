import { Packet } from "../index.js";

export class BotPacket extends Packet {
  readonly type = "bot";

  constructor(
    public botId?: string,
    public packet?: Packet,
  ) {
    super();
  }
}
