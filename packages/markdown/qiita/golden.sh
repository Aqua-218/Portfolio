#!/bin/sh
# 互換テスト(src/qiita/fixtures/)の正解を、本物のqiita-markdownで作り直す。
# DockerのRubyで、Gemfile.lockに固定した版を入れて動かす。見本(*.md)を足したり直したりしたら走らせる
set -eu
here=$(cd "$(dirname "$0")" && pwd)
image="ruby:3.4-bookworm@sha256:9d1b22f2341dc96a1cd2f4f4495a31c19495b42ed243f1338e60075210025fd4"
docker run --rm \
  -v "$here:/qiita" \
  -v "$here/../src/qiita/fixtures:/fixtures" \
  -w /qiita \
  "$image" \
  sh -c 'bundle config set --local path /tmp/gems >/dev/null && bundle install --quiet && bundle exec ruby render.rb /fixtures'
