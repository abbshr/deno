// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.

pub fn create_basic_runtime() -> tokio::runtime::Runtime {
  // ran-review: 5.1: 初始化 runtime. 包含: eventloop, executor. future 以及它衍生出的 task 都跑在这个 executor 上
  tokio::runtime::Builder::new()
    .basic_scheduler()
    .enable_io()
    .enable_time()
    .build()
    .unwrap()
}

// TODO(ry) rename to run_local ?
pub fn run_basic<F, R>(future: F) -> R
where
  F: std::future::Future<Output = R> + 'static,
{
  let mut rt = create_basic_runtime();
  // ran-review: 5.2: 阻塞当前线程, 等待 fut 结束
  rt.block_on(future)
}
