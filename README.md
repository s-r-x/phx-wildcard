# phx-wildcard

Wildcard support for phoenix channels

## Installation

```sh
npm i phx-wildcard
```

## Usage

```typescript
import { Socket } from 'phoenix';
import { Wildcard } from 'phx-wildcard';

const socket = new Socket('url');
socket.connect();
const ch = socket.channel('ch');
ch.join();

// phx-wildcard mutates channel's onMessage property(but saves the old one), 
// so if you need to rewrite onMessage(for logging or whatever)
// do your thing before creating a wildcard instance
const wc = new Wildcard(ch);
const cb1 = (e: string, payload: any) => {});
const cb2 = (e: string, payload: any) => {});
// any pattern supported by Matcher(https://github.com/sindresorhus/matcher)
wc.on('*', cb1);
wc.on(['event-*', '*-123'], cb2);
wc.off('*', cb1);
wc.off(['event-*', '*-123'], cb2);
wc.destroy();
```
