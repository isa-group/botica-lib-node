import { Mocked, vi } from "vitest";
import { RabbitMqClient } from "@/rabbitmq/index.js";

export const createMockRabbitMqClient = () => {
  const mockInstance: Mocked<Partial<RabbitMqClient>> = {
    createQueue: vi.fn().mockResolvedValue(undefined),
    bind: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockResolvedValue(undefined),
    closeConnection: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
  };

  return mockInstance as Mocked<RabbitMqClient>;
};
