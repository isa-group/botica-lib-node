/**
 * Represents a shutdown request from the Botica director.
 * This object is immutable and contains information about the request.
 */
export class ShutdownRequest {
  constructor(private readonly forced: boolean) {}

  /**
   * Returns whether this shutdown request is forced. When forced, the director
   * may shut down the container imminently, and shutdown hooks should only
   * be used to quickly save critical data. Cancellation attempts will be ignored.
   */
  get isForced(): boolean {
    return this.forced;
  }
}
