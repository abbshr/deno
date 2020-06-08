// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
import { core } from "./core.ts";
import * as dispatchMinimal from "./ops/dispatch_minimal.ts";
import * as dispatchJson from "./ops/dispatch_json.ts";
import * as util from "./util.ts";
import { setBuildInfo } from "./build.ts";
import { setVersions } from "./version.ts";
import { setPrepareStackTrace } from "./error_stack.ts";
import { Start, opStart } from "./ops/runtime.ts";
import { handleTimerMacrotask } from "./web/timers.ts";

export let OPS_CACHE: { [name: string]: number };

function getAsyncHandler(opName: string): (msg: Uint8Array) => void {
  // ran-review: 3.4.5.1.1. 对 `op_write`, `op_read` ops 使用 minimal 格式消息 handler
  // 其它 ops 使用 json 格式消息 handler
  switch (opName) {
    case "op_write":
    case "op_read":
      return dispatchMinimal.asyncMsgFromRust;
    default:
      return dispatchJson.asyncMsgFromRust;
  }
}

// TODO(bartlomieju): temporary solution, must be fixed when moving
// dispatches to separate crates
export function initOps(): void {
  // ran-review: 3.4.5.0 `core` 对象在 rust 侧实现并绑定到 isolate, 提供一部分原生方法:
  // - print
  // - recv
  // - send
  // - setMacrotaskCallback
  // - evalContext
  // - formatError
  // - encode
  // - decode
  // - getPromiseDetails
  // - shared (SharedArrayBuffer)
  // 而 `core` 上另外一些方法在 js 侧实现:
  // - setAsyncHandler
  // - dispatch
  // - ops
  // - sharedQueue 对象
  // 参见 core/core.js, 该 js 源码在 core/isolate.rs 的 `CoreIsolate::shared_init` 方法中加载
  OPS_CACHE = core.ops();
  for (const [name, opId] of Object.entries(OPS_CACHE)) {
    // ran-review: 3.4.5.1. `setAsyncHandler` 方法来自 core/core.js
    // `core.setAsyncHandler(opId, handler)` 为每个 ops 设置 handle: `asyncMsgFromRust`
    // 并全局调用一次 rust 侧绑定过来的方法 `recv(handleAsyncMsgFromRust)`
    // 用于接收来自 rust 侧的异步返回结果
    // 添加 opId => handler 映射在 `asyncHandlers` 对象维护.
    // `handleAsyncMsgFromRust` 回调函数接收 opId, buf, 并寻找 `asyncHandlers` 中已注册过的对应 handler
    core.setAsyncHandler(opId, getAsyncHandler(name));
  }
  // ran-review: 3.4.5.2. `core.setMacrotaskCallback(handleTimerMacrotask)` 注册回调, 回调执行 ready timer 检查, 以及 timer callback 执行
  // rust 侧将根据其返回值确定是否继续调用它直到清空所有就绪的 timer
  core.setMacrotaskCallback(handleTimerMacrotask);
}

export function start(source?: string): Start {
  // ran-review: 3.4.5. 初始化 js 侧 ops
  initOps();
  // First we send an empty `Start` message to let the privileged side know we
  // are ready. The response should be a `StartRes` message containing the CLI
  // args and other info.

  // ran-review: 3.4.6. 调用 js 侧 ops: `op_start`, 以通知 rust 侧准备就绪
  // 该消息通过 `sendSync()` 同步发送, rust 侧返回诸如 pid, cwd, 版本, debugFlag 等信息,
  // 参见 js/ops/runtime.ts 的 `Start` 接口
  const s = opStart();
  setVersions(s.denoVersion, s.v8Version, s.tsVersion);
  setBuildInfo(s.target);
  util.setLogDebug(s.debugFlag, source);
  // ran-review: 3.4.7. 设置 prepareStackTrace 处理函数, 用于自定义 Error 调用栈格式.
  // 参见 https://v8.dev/docs/stack-trace-api#customizing-stack-traces
  setPrepareStackTrace(Error);
  return s;
}
