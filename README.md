## Why theory.js

This library pretty much culminated itself from different theories I had about how to approach constructing and navigating objects in JavaScript.

Over time the code has taken on one key concept:

> Using descriptions and selections can be more powerful than bespoke code, and can make your system more generalised.

If you have an object that describes a behaviour, it forces you to break that behaviour down into constituent parts &mdash; and if you do things properly, those parts should be simple to understand and to re-use.

Keeping complex behaviour as descriptions also allows them to be more easily extended, exported or re-interpreted.

This library is still — as ever — a work in progress and has been since 2009 (don't worry, it has been rewritten a number of times since then).

I have committed this codebase now, just to give an example of my recent JavaScript development to prospective employers. The library won't really be of much use to others util I reach v1.0.

**Watch this space for new commits shortly :)**

---

## Getting started

The actual JavaScript library can be found within `./bin`. Which you can obviously just include this in your page as follows:

    <script src="bin/is.js"></script>
    <script src="bin/theory.js"></script>
    
    <!-- include each submodule as needed //-->
    <script src="bin/theory.string.js"></script>
    <script src="bin/theory.navigate.js"></script>

`is.js` is a standalone include that `theory.js` currently requires, and is responsible for type checking.

I may fold it into `theory.js` once I've got my code building and minifcation up and running for this repo. For now however, it must be included first.

There is also a `defer` or `async` method that is still in progress at the moment, but will be used as such:

    <script src="bin/is.js"></script>
    <script defer src="bin/theory.js">
      t.include ("bin/theory.string.js");
      t.include ("bin/theory.navigate.js");
    </script>

or:

    <script src="bin/is.js"></script>
    <script async src="bin/theory.js">
      t.include ("bin/theory.string.js");
      t.include ("bin/theory.navigate.js");
    </script>



Then if you wish to have other resources that depend on Theory:

    <noscript data-defered-until="theory">
    <script>
    console.log(theory, 'is read now');
    </script>
    <noscript>

The above would work with inline scripts, other script includes, link tags.

---

## Other useful things in this repo

If you wish to run any of the automated tests, try out the Theory demo, or generate the documentation locally &mdash; you'll need to do the following:

1. **Install `node` and `npm`** &mdash; if you don't have them already [https://nodejs.org/en/download/package-manager](https://nodejs.org/en/download/package-manager)

2. **Clone this repo to a folder on your computer, and change directory to that folder**

        git clone git@github.com:codelamp/theory.git theory; cd theory

4. **Create a variable to make it easier to refer to this folder (OPTIONAL)**

        export THEORY_DIR=$(pwd)
    
    You can use this variable (for the current termnial session) e.g.
    
        cd $THEORY_DIR

5. **Once installed, run `npm install` within `THEORY_DIR`**

        npm install

After running the above the following node modules should be installed:

1. `http-server`
2. `jasmine-core`
3. `karma`
4. `karma-chrome-launcher`
5. `karma-coverage`
6. `karma-jasmine`
6. `jsdoc`

> It should also ask if you wanted to download and install `Firebug lite` for the demo HTML. This only required (for the moment) if you wan't to run the demo.

If all the above seems to have gone well, then you have the choice of the following.

### Tests

Theory's tests are driven by Jasmine, the simplest way to view if the tests are passing is to run:

    open tests.html

Or to view the above HTML file in a browser.

If you'd rather run the tests from the command line, you can use [Karma](http://karma-runner.github.io).

Just before you do however, to make running it easier you may wish to install the following:

    npm install -g karma-cli

This allows you to type just `karma`, rather than having to specify the entire path.

Next you just need to execute the following in `$THEORY_DIR`.

    karma start

That should run each of the specs and report whether everything is running ok.

### Documentation

Next up is documentation. To run the documentation site locally you'll need to run the following:

    ./docs/serve.sh

To re-build the documentation:

    ./docs/make.sh

To view the live documentation, go here:

[http://codelamp.github.io/theory/docs/html](http://codelamp.github.io/theory/docs/html)

### Demo

To host the Theory demo locally so it can be viewed in a browser, execute the following:

    npm run serve

That will use `http-server` (which should have installed with `npm install`) to serve the required HTML, CSS and JS over localhost.

> Please Note: For now the demo really doesn't do anything. It will do shortly however.



---

## String Theory

String Theory &mdash; unlike its scientific namesake &mdash; has nothing to do with attempting to explain ultra-reallity, but instead everything to do with describing JavaScript structures. Initially built as a simple shorthand for navigating objects, the code has now been generalised to allow for construction of bespoke parser systems.

An example of `theory.string()` in use would be when using {@linkcode theory.navigate t.navigate}.

    t.navigate(myObject).select('firstKey/^keyStartsWith/($keyContains this)');

The path notation used above is parsed using String Theory. The parsing generates an internal object structure that is then used to navigate an Object structure.

See {@linkcode theory.string.shared.instructions.opn}, and navigate to the source code to see the description that powers the above parser.

### Creating a parser

Parsers are created by providing instruction sets for {@linkcode theory.string t.string} to use. Here is an cut-down set for parsing Theory's method overload keys:

    theory.string.instructions('theory-overload-keys', {
      'default': {
        content: [
          { ranges: ['squareOptional', 'square'] }
        ]
      },
      'squareOptional': {
        name: 'squareOptional',
        start: "[",
        end: "]?",
        content: [
          { divide: ['commas'], makes: 'item' }
        ]
      },
      'square': {
        name: 'square',
        start: "[",
        end: "]",
        content: [
          { divide: ['commas'], makes: 'item' }
        ]
      },
      'commas': {
        name: 'commas',
        token: ',',
        makes: 'item'
      },
      'item': {
        name: 'item'
      }
    });

Currently strings are broken up using either `ranges` or `divides`. The former finds a start and end point &mdash; based on tokens &mdash; and creates a new substring from that. The latter finds certain tokens and creates sub strings from the parts between the tokens. These ranges or divides are applied in a recursive manner, in the order described by the instruction set.

The process is actually quite simple, and can be followed manually, all you have to do is start at the `default` key and follow the logic.

For example, taking the string `[object, number, function] [object]?` the steps would be.

1. Start at `default` in the instruction set.
2. Scan for a range start of either `[` or `[` *(squareOptional or square)*.
3. Square would be found, and then squareOptional.
4. This would create three strings internally under a built-in type called `combination`.
5. "[object, number, function]", " ", and "[object]?"
6. For the `square`, scan for a divide of "," &mdash; each divide makes an `item`.
7. For the `squareOptional`, do the same as for `square`.
8. The resulting object *(simplified here for brevity)* would be `[['object', 'number', 'function'], ' ', ['object']]`.

Whilst to achieve the above seems quite simple, the code behind it is quite complex. This is because each specific operation takes into account the fact that tokens may be escaped, or within sub ranges... it is not just as simple as using `.indexOf` and `.split`.

> NOTE: For now only string tokens are supported, but the future should see Regular Expressions and ES6 support for string tokens.

For further information see the documentation at {@linkcode theory.string t.string}.

### Performance

It should be noted that `t.string` cannot, and will not, attempt to compete &mdash; in terms of performance &mdash; with actually coding your own lexical/parser system. What `t.string` is attempting to do is to make this process quicker and easier to accomplish. It never pays to optimise early, and if you can sketch out your idea quickly (and safely) directly in code, you can get your project up and running far faster. If whatever you have built suddenly becomes popular, or requires heavy optimisation, you can always switch out `t.string` for something more tailored. Especially as the interface i.e. a string of encoded information, will be implementation agnostic.

---

## Object Theory

... Unfortunately is still under development at the moment.

---

## Creator Theory

I need to write a nice section about this, but for the meantime, you can read here {@linkcode theory.creator}

---

<script>
document.querySelectorAll && (function(titles){
  var text;
  var strip = function(html){
    var container = document.createElement('div');
    container.innerHTML = html;
    html = container.textContent || container.innerText;
    container = null;
    return html;
  };
  for ( var i=0; i<titles.length; i++ ) {
    text = strip(titles[i].innerHTML);
    text = text.toLowerCase().replace(/[^a-z0-9]/g, '');
    titles[i].setAttribute('id', text);
  }
})(document.querySelectorAll('h1,h2,h3,h4,h5,h6'));
document.body && (function(elm){
  elm.innerHTML = [
    '<nav id="theory">',
      '<div class="center">',
        '<a href="#objecttheory" class="objectTheory"><img src="images/bubble-objecttheory.png" height="147" border="0" width="216"></a>',
        '<a href="#stringtheory" class="stringTheory"><img src="images/bubble-stringtheory.png" height="147" border="0" width="216"></a>',
        '<a href="#creatortheory" class="creatorTheory"><img src="images/bubble-creatortheory.png" height="147" border="0" width="216"></a>',
      '</div>',
    '</nav>',
    '<hr >'
  ].join("\n") + elm.innerHTML;
})(document.getElementById('readme'));
</script>