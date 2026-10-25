#!/bin/sh
# 書き出したout/を、本物のApache(ロリポップと同じく.htaccessを読む)で出して、apache/check.mjsで確かめる。
# 先にpnpm buildしておく。DockerのApacheは、.htaccessを読めるようにし、rewrite・headers・deflateを入れて動かす
set -eu
web=$(cd "$(dirname "$0")/.." && pwd)
image="httpd:2.4.69@sha256:a30cd4cd57f3f3c3be9b2d16384d2488839996bb14c67df2b51f1ecbb3e584a1"
port="${APACHE_PORT:-4180}"
conf=$(mktemp)
name="portfolio-apache-$$"
trap 'docker rm -f "$name" >/dev/null 2>&1 || true; rm -f "$conf"' EXIT

docker run --rm "$image" cat /usr/local/apache2/conf/httpd.conf |
  sed -e 's|^#LoadModule rewrite_module|LoadModule rewrite_module|' \
    -e 's|^#LoadModule headers_module|LoadModule headers_module|' \
    -e 's|^#LoadModule deflate_module|LoadModule deflate_module|' \
    -e 's|AllowOverride None|AllowOverride All|g' >"$conf"
chmod 644 "$conf"

docker run -d --name "$name" -p "127.0.0.1:$port:80" \
  -v "$web/out:/usr/local/apache2/htdocs:ro" \
  -v "$conf:/usr/local/apache2/conf/httpd.conf:ro" \
  "$image" >/dev/null

# 立ち上がるまで待つ
i=0
until curl -s -o /dev/null "http://127.0.0.1:$port/"; do
  i=$((i + 1))
  [ "$i" -lt 50 ] || { docker logs "$name"; exit 1; }
  sleep 0.2
done

APACHE="http://127.0.0.1:$port" node "$web/apache/check.mjs"
