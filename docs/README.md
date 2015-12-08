# Theory Documentation Generation

## Making

The documentation attached to this repo is powered by JSDoc. There is a shell script to make rebuilding easier:

    ./make.sh

By default the above sources its `conf.json`, and `theme` folder from this directory, but the projects `README` and `package.json` from the folder above.

The generated output is placed in `./html`.

## Serving

You can use any one of a number of ways to serve this documentation locally. There is a shell script that relies on the command `http-server`.

    ./serve.sh

By default the above will serve over `localhost:8881`.

## Live Documentation

Currently you will find the live documentation for this repo here:

[http://codelamp.github.io/theory/docs/html/theory/0.5.0](http://codelamp.github.io/theory/docs/html/theory/0.5.0)