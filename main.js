import { ipcMain } from "electron";
import JPCProtocol from "jpc/protocol.js";
import MessageCall from "jpc/message.js";
import { assert } from "jpc/util.js";

/**
 * Wire protocol API
 */
export default class JPCMainProcess extends JPCProtocol {
  /**
   * @param startObject {Object} Will be returned to client in "start" function
   */
  constructor(startObject) {
    super(startObject);
    this._call = new Main();
  }

  /**
   * Incoming calls.
   * Implements the wire protocol.
   *
   * @param method {string} the message name, e.g. "func", "get", etc.
   * @param listener {async function(payload {JSON}}
   * What the listener function returns is sent back as result to the caller.
   * If listener throws, sends the error message to the caller at the remote end.
   */
  registerIncomingCall(method, listener) {
    this._call.register(method, listener);
  }

  /**
   * Outgoing calls.
   * Implements the wire protocol.
   *
   * @param method {string} the message name, e.g. "func", "get" etc.
   * @param responseMethod {string} (optional)
   *    if given, wait for the remote side to respond with this method,
   *    and return the payload of `responseMethod`.
   * @param payload {JSON} see value in PROTOCOL.md
   * @returns {any} see value in PROTOCOL.md
   *   The payload of the corresponding `responseMethod` answer.
   *   If `responseMethod` is not given, returns null/undefined.
   * @throws {Error} if:
   *   - the remote end threw an exception
   *   - the connection disappeared
   */
  async callRemote(method, responseMethod, payload) {
    if (responseMethod) {
      return await this._call.makeCall(method, payload);
    } else {
      return this._call.makeCall(method, payload).catch(console.error);
    }
  }
}

class Main extends MessageCall {
  constructor() {
    super();
    ipcMain.on("asynchronous-message", (event, arg) => this._incomingMessage(arg));
    ipcMain.on("asynchronous-reply", (event, arg) => this._response(arg));
    ipcMain.handle("jpc", (event, arg) => this.handle(arg));
  }

  send(message) {
    let msgType = typeof(message.success) == "boolean" ? "asynchronous-reply" : "asynchronous-message";
    ipcMain.send(msgType, message);
  }

  /*
  async _incomingMessage(message, event) {
    await super._incomingMessage(message, replyMessage => {
      event.reply("asynchronous-reply", replyMessage);
    });
  }
  */

  async handle(message) {
    // The renderer process is calling a function here
    let func = this._functions[message.path];
    assert(func, "404 " + message.path + ": No such function registered");
    return func(message.arg);
  }
}
