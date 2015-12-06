current_dir=$BASH_SOURCE
script_dir=$(dirname $0)
source_dir="$script_dir/../bin"
config_file="${script_dir}/conf.json"
theme_dir="${script_dir}/theme"
readme_file="${script_dir}/../README.md"
package_file="${script_dir}/../package.json"
output_dir="${script_dir}/html"
command -v jsdoc >/dev/null 2>&1 || { echo >&2 "I require the command jsdoc but it does not seem to be around??"; exit 1; }
jsdoc $source_dir -c $config_file -t $theme_dir -R $readme_file -P $package_file -d $output_dir