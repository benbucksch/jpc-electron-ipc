# jpc-electron-ipc - Remote procedure calls between JS objects over the Electron IPC mechanism

jpc allows you to call JS objects in other processes. From your JS objects, it automatically
creates an API that resembles your object API, just with an `await` in front of every call.
It then transmits the call over the channel and call the objects in the remote process,
and returns the result back to you.

See the [jpc API](https://github.com/benbucksch/jpc/#README.md)

This uses the Electron IPC mechanism between the Electron [main process](https://www.electronjs.org/docs/api/ipc-main) and [renderer process](https://www.electronjs.org/docs/api/ipc-renderer), using asynchronous communication.

# Electron main process

```
import { JPCMainProcess } from "jpc-electron-ipc";

let jpc = new JPCMainProcess(myApp);
await jpc.init();
```


# Electron renderer process

```
import { JPCRendererProcess } from "jpc-electron-ipc";

let jpc = new JPCRendererProcess();
await jpc.init();
let myApp = await jpc.getRemoteStartObject();
```
