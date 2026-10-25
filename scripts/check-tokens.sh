#!/bin/sh
# GitHubのトークンが、コミットしたファイルや書き出したサイトに入っていないか確かめる。
# 管理画面はトークンでGitHubを操作するので、うっかり入れたまま公開しないようにする。
# 使い方: sh scripts/check-tokens.sh [ほかに調べるディレクトリ...]
set -eu
# 細かい権限のトークン(github_pat_)と、昔のトークン(ghp_など)
pattern='github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{36}'
found=$(
  {
    git ls-files -z | xargs -0 grep -IlE "$pattern" 2>/dev/null || true
    for dir in "$@"; do
      grep -rIlE "$pattern" "$dir" 2>/dev/null || true
    done
  } | sort -u
)
if [ -n "$found" ]; then
  echo "トークンらしい文字列が入っている。消してからもう一度ビルドする:" >&2
  echo "$found" >&2
  exit 1
fi
echo "トークンは入っていない"
