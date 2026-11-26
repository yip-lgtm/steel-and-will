#!/bin/sh
case "$1" in
  Username*) echo "x-access-token" ;;
  Password*) echo "$GITHUB_PUSH_TOKEN" ;;
  *) echo "$GITHUB_PUSH_TOKEN" ;;
esac
