current_dir=$BASH_SOURCE
script_dir=$(dirname $0)
output_dir="$script_dir/html/theory/0.5.0/"
command -v http-server >/dev/null 2>&1 || { echo >&2 "I require the command http-server but it does not seem to be around??"; exit 1; }
http-server $output_dir -p8881