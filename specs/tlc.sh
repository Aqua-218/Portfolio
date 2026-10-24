#!/bin/sh
# PlusCalをTLAに変換し直して、TLCで検査する。
# Curtain.cfgは通り、わざと壊したCurtainBroken.cfgはNoDoubleOpenで落ちることを確かめる。
# tla2toolsはTLA_VERSIONの版を~/.cache/pxcat-tla/に入れる。Javaが要る。
set -eu
TLA_VERSION=1.7.4
specs=$(cd "$(dirname "$0")" && pwd)
cache=${PXCAT_TLA_HOME:-$HOME/.cache/pxcat-tla}
jar=$cache/tla2tools-$TLA_VERSION.jar

if [ ! -f "$jar" ]; then
  mkdir -p "$cache"
  curl -fsSL -o "$jar.tmp" "https://github.com/tlaplus/tlaplus/releases/download/v$TLA_VERSION/tla2tools.jar"
  mv "$jar.tmp" "$jar"
fi

meta=$(mktemp -d)
trap 'rm -rf "$meta"' EXIT
cd "$specs"

java -cp "$jar" pcal.trans -nocfg Curtain.tla >/dev/null
rm -f Curtain.old

tlc() {
  java -XX:+UseParallelGC -cp "$jar" tlc2.TLC -workers auto -metadir "$meta" "$@"
}

tlc -config Curtain.cfg Curtain

if out=$(tlc -config CurtainBroken.cfg Curtain 2>&1); then
  echo "CurtainBroken.cfg が通ってしまった。壊した仕様で落ちないなら、検査が効いていない" >&2
  exit 1
fi
echo "$out" | grep -q "Invariant NoDoubleOpen is violated" || {
  echo "$out" >&2
  echo "CurtainBroken.cfg が NoDoubleOpen 以外で落ちた" >&2
  exit 1
}
echo "CurtainBroken.cfg は NoDoubleOpen で落ちた(期待どおり)"

# 実行例。CurtainTrace*.cfgの条件を破るまでの最短の実行例を、traces/に保存する。
# 幕の実装のテスト(Vitest)がこれを読んで再生する。同じものが出るよう、ワーカーは1つにする
mkdir -p traces
for cfg in CurtainTrace*.cfg; do
  name=${cfg#CurtainTrace}
  name=${name%.cfg}
  out=$(java -cp "$jar" tlc2.TLC -workers 1 -metadir "$meta/$name" -config "$cfg" Curtain 2>&1 || true)
  echo "$out" | grep -q "Invariant Not$name is violated" || {
    echo "$out" >&2
    echo "$cfg から実行例が出なかった" >&2
    exit 1
  }
  # 「State 1: <Initial predicate>」から状態の並びだけを取り出し、行番号などは落とす
  echo "$out" |
    sed -n '/^State 1:/,/states generated/p' |
    grep -v 'states generated' |
    sed -E 's/^(State [0-9]+: <[A-Za-z]+( predicate)?)[^>]*>/\1>/' \
      >"traces/$name.txt"
  echo "traces/$name.txt に実行例を書き出した"
done
