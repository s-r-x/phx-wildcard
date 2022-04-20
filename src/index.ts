import { isMatch } from 'matcher';
import type { Channel } from 'phoenix';

export type Glob = string | string[];
export type Callback = (event: string, payload: any, ref?: any) => any;
type Subscriber = {
  glob: Glob;
  cb: Callback;
};

export class Wildcard {
  constructor(private _channel: Channel) {
    if (!_channel) {
      throw new Error('Phoenix channel is required');
    }
    this._initialOnMessageCallback = this._channel.onMessage;
    this._channel.onMessage = this._onMessage;
  }
  public on(glob: Glob, cb: Callback): void {
    this._throwErrorIfDestroyed();
    this._subscribers.push({ glob, cb });
  }
  public off(glob: Glob, cb: Callback): void {
    this._throwErrorIfDestroyed();
    const idx = this._subscribers.findIndex(sub => {
      if (sub.cb !== cb) {
        return false;
      }
      if (Array.isArray(glob) && Array.isArray(sub.glob)) {
        return glob.every((pattern, idx) => pattern === sub.glob[idx]);
      }
      return glob === sub.glob;
    });
    if (idx !== -1) {
      this._subscribers.splice(idx, 1);
    }
  }
  public destroy(): void {
    this._throwErrorIfDestroyed();
    this._subscribers = [];
    this._channel.onMessage = this._initialOnMessageCallback;
    this._channel = (undefined as unknown) as Channel;
    this._initialOnMessageCallback = (undefined as unknown) as Callback;
    this._isDestroyed = true;
  }
  public get isDestroyed(): boolean {
    return this._isDestroyed;
  }
  public get channel(): Channel {
    return this._channel;
  }
  public set channel(channel: Channel) {
    this._channel = channel;
    this._initialOnMessageCallback = channel.onMessage;
    channel.onMessage = this._onMessage;
  }
  public get subscribers(): Subscriber[] {
    return this._subscribers;
  }

  private _subscribers: Subscriber[] = [];
  private _isDestroyed = false;
  private _initialOnMessageCallback: Callback;
  private _throwErrorIfDestroyed() {
    if (this._isDestroyed) {
      throw new Error('This Wildcard instance is destroyed. Create a new one.');
    }
  }
  private _onMessage = (event: string, payload: any, ref: any) => {
    let finalPayload = payload;
    if (this._initialOnMessageCallback) {
      finalPayload = this._initialOnMessageCallback(event, payload, ref);
    }
    if (event) {
      this._subscribers.forEach(sub => {
        if (isMatch(event, sub.glob)) {
          sub.cb(event, finalPayload, ref);
        }
      });
    }
    return finalPayload;
  };
}
