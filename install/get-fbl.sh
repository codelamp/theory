current_dir=$BASH_SOURCE
script_dir=$(dirname $0)
test_dir="$script_dir/../test"
fbl_dir="$script_dir/../test/firebug-lite"
fbl_tar="$script_dir/../test/firebug-lite.tar.tgz"
output_path=$(cd "${fbl_dir%/*}" && echo "$PWD/${fbl_dir##*/}")

if [ ! -d "$fbl_dir" ]; then
  read -p "Would you like to download Firebug Lite for demo.html? " -r
  if [[ ! $REPLY =~ ^[Yy]$ ]]
  then
      exit 1
  fi
  echo "Firebug Lite : Downloading" \
    && curl --progress-bar -o $fbl_tar "https://getfirebug.com/releases/lite/latest/firebug-lite.tar.tgz" \
    && echo "Firebug Lite : Extracting tar" \
    && tar -xzf $fbl_tar -C $test_dir \
    && echo "Firebug Lite : Removing tarball" \
    && rm $fbl_tar \
    && echo "Firebug Lite : Attempting to fix extracted file permissions" \
    && sudo find $test_dir -type d -exec chmod a+x {} \; \
    && echo "Firebug Lite : All complete!" \
    && echo \
    && echo "You will find Firebug Lite at $output_path" \
    && echo
fi