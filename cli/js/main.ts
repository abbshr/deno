// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
import { bootstrapMainRuntime } from "./runtime_main.ts";
import { bootstrapWorkerRuntime } from "./runtime_worker.ts";

// Removes the `__proto__` for security reasons.  This intentionally makes
// Deno non compliant with ECMA-262 Annex B.2.2.1
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (Object.prototype as any).__proto__;

Object.defineProperties(globalThis, {
  bootstrap: {
    value: {
      // ran-review: 3.4.1. js 逻辑入口
      // 该方法存在于 snapshot 中, 因此可以直接调用
      mainRuntime: bootstrapMainRuntime,
      workerRuntime: bootstrapWorkerRuntime,
    },
    configurable: true,
    writable: true,
  },
});
