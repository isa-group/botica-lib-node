export class ShutdownRequest {
  constructor(
    private readonly forced: boolean,
    private canceled = false,
  ) {}

  /**
   * Returns whether this shutdown request is forced. This means that the director may shut down the
   * container imminently: shutdown hooks should only save important data quickly.
   */
  get isForced(): boolean {
    return this.forced;
  }

  /**
   * Attempts to cancel this shutdown.
   *
   * Note that if this shutdown request is {@link isForced forced}, canceling will have no
   * effect, and the director may proceed with the shutdown regardless.
   */
  cancel(): void {
    this.isCanceled = true;
  }

  /**
   * Sets whether this shutdown should be canceled.
   *
   * <p>Note that if this shutdown request is {@link isForced forced}, canceling will have no
   * effect, and the director may proceed with the shutdown regardless.
   */
  set isCanceled(value: boolean) {
    this.canceled = value;
  }

  /**
   * Returns whether this shutdown request is canceled. This will have no real effect if the
   * shutdown request is forced.
   */
  get isCanceled(): boolean {
    return this.canceled;
  }
}
