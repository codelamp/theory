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

To view the live tests, go here:

[http://codelamp.github.io/theory/tests.html](http://codelamp.github.io/theory/tests.html)

### Code Coverage

This is powered by [Karma](http://karma-runner.github.io) and [Istanbul](https://www.npmjs.com/package/karma-istanbul-reporter).

The current output for this version of the repo lies here:

[http://codelamp.github.io/theory/docs/html/theory/0.5.0/coverage](http://codelamp.github.io/theory/docs/html/theory/0.5.0/coverage)

### Documentation

Next up is documentation. To run the documentation site locally you'll need to run the following:

    ./docs/serve.sh

To re-build the documentation:

    ./docs/make.sh

To view the live documentation, go here:

[http://codelamp.github.io/theory/docs/html/theory/0.5.0](http://codelamp.github.io/theory/docs/html/theory/0.5.0)

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

## Overload Theory

Despite the fact that I really do like JavaScript — I am impervious to your mockery that once was, or perhaps still is ;) — like every language, there are things I would change.

One of these changes would be to give JavaScript better handling of function arguments.

Support for abilities like default, orderless and remaining parameters would be great. Thankfully it seems — from what I have read — the up coming changes to JavaScript (ECMAScript 2015 / ES6) look promising. Unfortunately it is going to take a while before any of these abilities can be relied upon.

1. [Default Parameters](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Functions/default_parameters)
2. [Remaining Parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters) a.k.a. `... rest` parameters
3. [Orderless Parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#Function_argument_defaults) a.k.a. Function argument defaults

Theory has existed — in some form — within my own private codings for a while, since 2010. And within that code there has always been some form of another ability I would like JavaScript to have...

### Overloaded methods

Now I've read a lot on the subject of "overloaded methods" with JavaScript, and as with anything, there are a lot of opinions.

Take this Stack Overflow post as an example, [Function Overloading in JavaScript best practices](http://stackoverflow.com/questions/456177/function-overloading-in-javascript-best-practices)

The opinions can be (pretty much) split in to:

1. It does not exist for JavaScript.
2. It will be too slow.
3. Just do it based on number of arguments.
4. Pass an object to your method, and test for certain properties.
5. Use specific type checking within the function.

**The first point is just being pedantic about the naming of it.** Yes, compile-time method overloading doesn't exist. From here on in, I am referring to "overloading-like" behaviour. That is, the same method name can be called, but provide different behaviour depending on the type of arguments passed. It provides this behaviour either within itself or delegates to other grouped methods.

**The second point about things being too slow, is relative.** It really depends on what you need to achieve with your code. Any additional code you add to a system causes a slow-down. Which means you could argue that adding any feature hampers performance. Personally I prefer quick sketch-ability and readability of code, which you can later optimise if the project you are working on requires it.

**The third point does work.** In fact I believe it is used in a number of well know libraries e.g. jQuery. However, my main reason for wanting "overloading-like" behaviour has been that one of my arguments may change type. That isn't covered by the "count the arguments" approach. I also find that prefixing a bunch of logic to the start of the function, just to manage type detection, as rather ugly and unreadable.

**Point four is useful.** For certain functions or parameters this can work well e.g. `method({name: 'string', list: [], options: {}});`. There are downsides however. If you change your parameters in the function, you have to change the calling code too. It can be a bit laborious having to construct an object for each of your method calls. Plus it does have overheads.

**Point five is pretty much what you are left with.** And whilst checking the type of parameters at call-time will be slower than not doing so. I personally believe the benefits in simplicity of the higher-level code are worth it; as long as the ability isn't used for methods that are called in high frequency. The problem is the implementations I've seen of this method tend to hamper readability.

With Theory I like to think I've implemented it in a nice way. But I'm sure there will be coders out there that will be horrified. My main aim has been to separate out the overloading specification from the code itself, as I believe this aids readability.

### How it works

`t.overload` is quite simple to use, an example would be:

    var method = t.overload({
      '[string, array]': function(name, list){
        // simple overload based on types
      },
      '[array, object]': function(list, options){
        // each denoted function will only be called if types match exactly
      },
      '[string, array, object]': function(name, list, options){
        // currently there aren't many optimisations, but the plan is to be intelligent
        // if the overloads are unique based on their number of arguments -- this could
        // be automatically switched to. If the overloads are only based on a specific
        // parameter changing, the internal code could be made to focus on this.
      }
    });

When `method()` is called, the arguments that are passed are converted to a string key e.g. `"[number, number]"` — through a mixture of duck typing and constructor checking. This is then used to look-up the method to call on the description object.

A `new Error()` is thrown if the method is called with arguments it doesn't understand i.e. a key can't be found on the description object.

`t.overload` converts parameters to types using `is.what()`, which can be extended or changed quite easily. It is also a key place to develop optimisations in the future.

### Taking it further

I have extended the base functionality outlined above with modules, these can be found under {@linkcode theory.overload.descProcessors}.

These work on the description object that is passed in, processing it, and returning something modified. This means that a lot of the work that goes into these additional extras is calculated when you define your overloaded methods (and not at call time).

Current `descProcessors` are:

1. inlineNames
2. translateToArgsObject
3. alternativeKeys
4. optionalArguments

### Inline Names & Translate To Args Object

These two modules work in harmony and allows you to define your parameter names in a way that `t.overload` can understand:

    var method = t.overload({
      '[string:name, array:list]': function(args){
        // here we should have args.name and args.list
      },
      '[array:list, object:options]': function(args){
        // here we should have args.list and args.options
      }
    });

This means that the function receives an object with a property for each named parameter that was passed in.

<i class="fa fa-info-circle"></i>&nbsp; With the current codebase, the object that is passed in as `args` is always a newly created object. However, based upon recent reading I may switch this to be an object that is reused (for optimisation reasons).

<i class="fa fa-info-circle"></i>&nbsp; It should be noted that the string parsing that occurs within `t.overload` has not been heavily tested with the aim to break the system. I'm sure it would be very easy to find parameter names that should work, but that trip errors. This is the kind of work I will be putting in as I travel towards [v1.0.1](https://github.com/codelamp/theory/milestones/v1.0.0)

> This might seem an odd choice, but stick with me. Again, I'm sure there will be shudders elsewhere on the interweb.

### Alternative Keys

The downside to being specific with types is that *you have to be specific*.

Especially in the way that `t.overload` works, if your look-up key doesn't exist in the overload description, then you get an error. For example:

    var method = t.overload({
      '[string]': function(args){},
      '[array]': function(args){}
    });
    method({}); // would trip an Error.

This is completely opposite to the way that JavaScript normally works.

Unfortunately I'm still working towards a wildcard option. E.g.

    var method = t.overload({
      '[string]': function(arg){},
      '[array]': function(arg){},
      '[*]': function(arg){}
    });

But this will require me to add more optimisation logic into `t.overload` which I don't have time for just yet. I'd rather hold off and implement it properly, than add a very involved or slow method now.

For now, the Alternative Keys module provides a way to be more flexible with types instead.

    var method = t.overload({
      '[string|object|array]': function(oneOfThree){},
    });

The above will allow you to pass in strings, literal objects or arrays to the same parameter.

When the function is constructed by `t.overload`, this module steps in a basically converts the description object to:

    {
      '[string]': function(oneOfThree){},
      '[object]': function(oneOfThree){},
      '[array]': function(oneOfThree){},
    }

Where the function is the same reference i.e. the same function.


### Optional Arguments

Another issue with being specific, is that we've lost the ability to have optional parameters. This module brings them back.

    var method = t.overload({
      '[string] [object]?': function(name, options){
        // in here options will be optional
      }
    });

This operates in a similar way to the Alternative Keys module, in that it modifies the overload description like so:

    {
      '[string]': function(name, options){},
      '[string, object]': function(name, options){}
    }

Each function above is referencing the same function.

You can have as many optional groups, with as many parameters, as you like. Just bear in mind, the more parameters, the more types that are checked.

    var method = t.overload({
      '[string] [object]? [number]?': function(name, options, delay){
        // in here options will be optional
      }
    });

<i class="fa fa-info-circle"></i>&nbsp;As with all optional arguments, the optional parameters must come after the require parameters. Currently there is no coded check for this however — and I'm not entirely sure what would happen if you didn't adhere to this. Probably nothing good.

Those of you who are awake, may ask what does this do?

    var method = t.overload({
      '[string] [object, number]? [array]?': function(name, options, delay, list){}
    });

The answer is:

    {
      '[string]': function(name, options, delay, list){},
      '[string, object, number]': function(name, options, delay, list){},
      '[string, object, number, array]': function(name, options, delay, list){}
    }

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
        '<a href="#stringtheory" class="string-theory"><img src="images/bubble-string-theory.png" height="147" border="0" width="216"></a>',
        '<a href="#creatortheory" class="creator-theory"><img src="images/bubble-creator-theory.png" height="147" border="0" width="216"></a>',
        '<a href="#overloadtheory" class="overload-theory"><img src="images/bubble-overload-theory.png" height="147" border="0" width="216"></a>',
        '<a href="#objecttheory" class="object-theory"><img src="images/bubble-object-theory.png" height="147" border="0" width="216"></a>',
      '</div>',
    '</nav>',
    '<hr >'
  ].join("\n") + elm.innerHTML;
})(document.getElementById('readme'));
</script>