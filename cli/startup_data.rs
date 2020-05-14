// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
#[cfg(feature = "no-snapshot-init")]
use deno_core::Script;

use crate::js::CLI_SNAPSHOT;
use crate::js::COMPILER_SNAPSHOT;
use deno_core::Snapshot;
use deno_core::StartupData;

#[cfg(feature = "no-snapshot-init")]
pub fn deno_isolate_init() -> StartupData<'static> {
  debug!("Deno isolate init without snapshots.");
  #[cfg(not(feature = "check-only"))]
  let source =
    include_str!(concat!(env!("GN_OUT_DIR"), "/gen/cli/bundle/main.js"));
  #[cfg(feature = "check-only")]
  let source = "";

  StartupData::Script(Script {
    filename: "gen/cli/bundle/main.js",
    source,
  })
}

#[cfg(not(feature = "no-snapshot-init"))]
pub fn deno_isolate_init() -> StartupData<'static> {
  debug!("Deno isolate init with snapshots.");
  #[cfg(not(feature = "check-only"))]
  let data = CLI_SNAPSHOT;
  #[cfg(feature = "check-only")]
  let data = b"";

  // ran-review: 3.2.1.
  debug!("CLI_SNAPSHOT PATH: {:?}", concat!(env!("OUT_DIR"), "/CLI_SNAPSHOT.bin"));
  debug!("startup_data.deno_isolate_init() -> data: {:?}", data);

  StartupData::Snapshot(Snapshot::Static(data))
}

#[cfg(feature = "no-snapshot-init")]
pub fn compiler_isolate_init() -> StartupData<'static> {
  debug!("Compiler isolate init without snapshots.");
  #[cfg(not(feature = "check-only"))]
  let source =
    include_str!(concat!(env!("GN_OUT_DIR"), "/gen/cli/bundle/compiler.js"));
  #[cfg(feature = "check-only")]
  let source = "";

  StartupData::Script(Script {
    filename: "gen/cli/bundle/compiler.js",
    source,
  })
}

#[cfg(not(feature = "no-snapshot-init"))]
pub fn compiler_isolate_init() -> StartupData<'static> {
  debug!("Compiler isolate init with snapshots.");
  #[cfg(not(feature = "check-only"))]
  let data = COMPILER_SNAPSHOT;
  #[cfg(feature = "check-only")]
  let data = b"";

  StartupData::Snapshot(Snapshot::Static(data))
}
