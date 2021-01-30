import { ipcRenderer } from "electron";
import JPCProtocol from "jpc/protocol.js";
import MessageCall from "jpc/message.js";
import { assert } from "jpc/util.js";

/**
 * Wire protocol API
 */
export default class JPCRendererProcess extends JPCProtocol {
  /**
   * @param startObject {Object} Will be returned to client in "start" function
   */
  constructor(startObject) {
    super(startObject);
    this._call = new Renderer();
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

class Renderer extends MessageCall {
  constructor() {
    super();
    ipcRenderer.on("asynchronous-message", (event, arg) => this._incomingMessage(arg, event));
    ipcRenderer.on("asynchronous-reply", (event, arg) => this._response(arg));
  }

  send(message) {
    let msgType = typeof(message.success) == "boolean" ? "asynchronous-reply" : "asynchronous-message";
    ipcRenderer.send(msgType, message);
  }

  /**
   * Calls a function in the main process.
   * Attention: This will not work, if you call from one renderer process to another renderer process.
   *
   * @param path {string}   like the path component of a HTTP URL.
   *    E.g. "/contact/call/" or "register".
   *    Must match the registration on the other side exactly, including leading slash or not.
   * @param arg {JSON}   arguments for the function call
   * @param {Promise} waits until the call returns with a result or Exception
   */
  async makeCall(path, arg) {
    assert(path && typeof(path) == "string");
    assert(!arg || typeof(arg) == "object");
    return await ipcRenderer.invoke("jpc", {
      path: path,
      arg: arg,
    });
  }
}
