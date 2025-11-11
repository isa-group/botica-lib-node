import { Mocked, vi } from "vitest";
import { BoticaClient } from "@/protocol/index.js";

export const mockBoticaClient: Mocked<BoticaClient> = {
  connect: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  isConnected: vi.fn().mockReturnValue(true),
  registerOrderListener: vi.fn(),
  publishOrder: vi.fn().mockResolvedValue(undefined),
  sendPacket: vi.fn().mockResolvedValue(undefined),
  registerPacketListener: vi.fn(),
  registerQueryListener: vi.fn().mockResolvedValue(undefined),
  sendQuery: vi.fn().mockResolvedValue(undefined),
};
