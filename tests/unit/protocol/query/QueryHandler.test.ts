import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  QueryHandler,
  RequestPacket,
  ResponsePacket,
} from "@/protocol/index.js";

class TestRequestPacket extends RequestPacket<TestResponsePacket> {
  type = "testRequest" as const;
  responsePacketType = "testResponse" as const;
}

class TestResponsePacket extends ResponsePacket {
  type = "testResponse" as const;
}

vi.useFakeTimers();

describe("QueryHandler", () => {
  let queryHandler: QueryHandler;

  beforeEach(() => {
    queryHandler = new QueryHandler();
  });

  it("should register a query, call the callback on response, and clear the timeout", () => {
    const request = new TestRequestPacket();
    const callback = vi.fn();
    const timeoutCallback = vi.fn();

    queryHandler.registerQuery(request, callback, timeoutCallback, 5000);

    // Ensure requestId was assigned
    const requestId = request.requestId;
    expect(requestId).toBeDefined();

    // Simulate receiving the response
    const response = new TestResponsePacket(requestId);
    queryHandler.acceptResponse(response);

    // Verify callback was called and timeout was not
    expect(callback).toHaveBeenCalledWith(response);
    expect(timeoutCallback).not.toHaveBeenCalled();

    // Advance time to ensure the timeout was cleared and doesn't fire later
    vi.advanceTimersByTime(6000);
    expect(timeoutCallback).not.toHaveBeenCalled();
  });

  it("should call the timeout callback when no response is received in time", () => {
    const request = new TestRequestPacket();
    const callback = vi.fn();
    const timeoutCallback = vi.fn();

    queryHandler.registerQuery(request, callback, timeoutCallback, 5000);

    // Advance time past the timeout
    vi.advanceTimersByTime(5001);

    expect(timeoutCallback).toHaveBeenCalledTimes(1);
    expect(callback).not.toHaveBeenCalled();
  });

  it("should not call the original callback if a response arrives after a timeout", () => {
    const request = new TestRequestPacket();
    const callback = vi.fn();
    const timeoutCallback = vi.fn();

    queryHandler.registerQuery(request, callback, timeoutCallback, 5000);

    const requestId = request.requestId;

    // Trigger timeout
    vi.advanceTimersByTime(5001);
    expect(timeoutCallback).toHaveBeenCalledTimes(1);

    // Simulate a late response
    const response = new TestResponsePacket();
    response.requestId = requestId;
    queryHandler.acceptResponse(response);

    expect(callback).not.toHaveBeenCalled();
  });

  it("should do nothing when accepting a response with an unknown requestId", () => {
    const response = new TestResponsePacket();
    response.requestId = "unknown-id";

    // This should not throw an error
    expect(() => queryHandler.acceptResponse(response)).not.toThrow();
  });
});
