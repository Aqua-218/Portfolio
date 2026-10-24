#!/bin/sh
# pxcat-coreをCharonとAeneasでLeanにして、proofs/PxCat/Types.leanとFuns.leanに書き出す。
# 道具はaeneas.envの版で~/.cache/pxcat-aeneas/に入れる。入っていれば入れ直さない。
# Charonのビルドにはrustupが要る。
set -eu
proofs=$(cd "$(dirname "$0")" && pwd)
root=$(dirname "$proofs")
. "$proofs/aeneas.env"
tools=${PXCAT_AENEAS_HOME:-$HOME/.cache/pxcat-aeneas}
charon_home=$tools/charon-$CHARON_REV
aeneas_home=$tools/aeneas-$AENEAS_RELEASE

if [ ! -x "$charon_home/bin/charon" ]; then
  rustup toolchain install "$CHARON_TOOLCHAIN" --profile minimal -c rustc-dev,llvm-tools,rust-src
  cargo "+$CHARON_TOOLCHAIN" install --git https://github.com/AeneasVerif/charon \
    --rev "$CHARON_REV" --locked --root "$charon_home" charon
fi

if [ ! -x "$aeneas_home/aeneas" ]; then
  mkdir -p "$aeneas_home"
  curl -fsSL "https://github.com/AeneasVerif/aeneas/releases/download/$AENEAS_RELEASE/aeneas-linux-x86_64.tar.gz" |
    tar xz -C "$aeneas_home" aeneas
fi

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
(
  cd "$root/crates/pxcat-core"
  PATH="$charon_home/bin:$PATH" RUSTUP_TOOLCHAIN=$CHARON_TOOLCHAIN \
    charon cargo --preset=aeneas --dest-file "$tmp/pxcat_core.llbc"
)
"$aeneas_home/aeneas" -backend lean -split-files -subdir PxCat -dest "$tmp/out" "$tmp/pxcat_core.llbc"
cp "$tmp/out/PxCat/Types.lean" "$tmp/out/PxCat/Funs.lean" "$proofs/PxCat/"
