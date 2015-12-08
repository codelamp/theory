# https://github.com/indexzero/http-server
command -v http-server >/dev/null 2>&1 || { echo >&2 "I require the command http-server but it does not seem to be around??"; exit 1; }
http-server . -p8885 -o