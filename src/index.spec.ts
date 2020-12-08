import { Wildcard, INTERNAL_PHX_EVENTS, Glob } from './';
import { Channel } from 'phoenix';

const createChannelMock = () => {
  return ({} as unknown) as Channel;
};
const createSub = (glob: Glob) => ({
  glob,
  cb: jest.fn(),
});

it('should add and remove subscribers ', () => {
  const channel = createChannelMock();
  const wildcard = new Wildcard(channel);
  const sub = createSub('*');
  const sub2 = createSub(['*']);
  wildcard.on(sub.glob, sub.cb);
  wildcard.on(sub2.glob, sub2.cb);
  expect(wildcard.subscribers).toHaveLength(2);
  expect(wildcard.subscribers[0]).toEqual({
    cb: sub.cb,
    glob: sub.glob,
  });
  expect(wildcard.subscribers[1]).toEqual({
    cb: sub2.cb,
    glob: sub2.glob,
  });
  wildcard.off('*', sub.cb);
  expect(wildcard.subscribers).toHaveLength(1);
  expect(wildcard.subscribers[0]).toEqual({
    cb: sub2.cb,
    glob: sub2.glob,
  });
  wildcard.off(['**'], sub2.cb);
  expect(wildcard.subscribers).toHaveLength(1);
  wildcard.off(['*'], sub2.cb);
  expect(wildcard.subscribers).toHaveLength(0);
});
it('should destroy instance', () => {
  const channel = createChannelMock();
  const wildcard = new Wildcard(channel);
  wildcard.on('*', jest.fn());
  wildcard.destroy();
  expect(wildcard.isDestroyed).toBe(true);
  expect(wildcard.subscribers).toHaveLength(0);
  expect(wildcard.channel).toBeUndefined;
});
it('should throw an error if instance is destroyed', () => {
  const channel = createChannelMock();
  const wildcard = new Wildcard(channel);
  wildcard.destroy();
  expect(() => wildcard.on('*', jest.fn())).toThrow(Error);
  expect(() => wildcard.off('*', jest.fn())).toThrow(Error);
  expect(() => wildcard.destroy()).toThrow(Error);
});
it('should trigger subscribers on incoming events', () => {
  const channel = createChannelMock();
  const wildcard = new Wildcard(channel);
  const sub1 = createSub(['event-*', '*-123']);
  const sub2 = createSub('*');
  const sub3 = createSub('another-event');
  wildcard.on(sub1.glob, sub1.cb);
  wildcard.on(sub2.glob, sub2.cb);
  wildcard.on(sub3.glob, sub3.cb);
  const args: [string, any, number] = ['event-123', { answer: 42 }, 1];
  channel.onMessage(...args);
  expect(sub1.cb).toHaveBeenCalledTimes(1);
  expect(sub1.cb).toHaveBeenCalledWith(...args);
  expect(sub2.cb).toHaveBeenCalledTimes(1);
  expect(sub2.cb).toHaveBeenCalledWith(...args);
  expect(sub3.cb).toHaveBeenCalledTimes(0);
});
it('should ignore internal phoenix events', () => {
  const channel = createChannelMock();
  const wildcard = new Wildcard(channel);
  const sub = createSub('*');
  wildcard.on(sub.glob, sub.cb);
  [...Array.from(INTERNAL_PHX_EVENTS), 'event'].forEach(event => {
    channel.onMessage(event, null, 1);
  });
  expect(sub.cb).toBeCalledTimes(1);
});
it('should call initial onMessage callback', () => {
  const channel = createChannelMock();
  const TRANSFORMED_PAYLOAD = 'new_payload';
  channel.onMessage = () => TRANSFORMED_PAYLOAD;

  const wildcard = new Wildcard(channel);
  const sub = createSub('*');
  wildcard.on(sub.glob, sub.cb);
  channel.onMessage('event', 'old_payload', 1);
  expect(sub.cb).toBeCalledWith('event', TRANSFORMED_PAYLOAD, 1);
});
