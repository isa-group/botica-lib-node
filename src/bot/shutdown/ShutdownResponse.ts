/**
 * Represents the response to a shutdown request, which can be modified by
 * shutdown hooks to attempt to cancel the shutdown.
 */
export class ShutdownResponse {
  private _isCanceled: boolean = false;

  constructor(canceled: boolean = false) {
    this._isCanceled = canceled;
  }

  /**
   * Returns whether this shutdown request has been marked as canceled.
   */
  get isCanceled(): boolean {
    return this._isCanceled;
  }

  /**
   * Sets whether to attempt to cancel this shutdown.
   *
   * Note: If the shutdown request is forced, canceling will have no effect.
   *
   * @param canceled `true` to attempt to cancel the shutdown.
   */
  setCanceled(canceled: boolean): void {
    this._isCanceled = canceled;
  }
}
