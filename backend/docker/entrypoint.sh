#!/bin/sh
set -e

mkdir -p var/cache var/log var/uploads/avatars
php bin/console cache:warmup --no-interaction

exec frankenphp run --config /etc/frankenphp/Caddyfile