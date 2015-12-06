## Why theory.js

This library pretty much culminated itself from different theories I had about how to approach constructing and navigating objects in JavaScript.

Over time the code has taken on one key concept:

> Using descriptions can be more powerful than bespoke code, and can make your system more generalised.

If you have an object that describes a behaviour, it forces you to break that behaviour down into constituent parts &mdash; and if you do things properly, those parts should be simple to understand and to re-use.

Keeping complex behaviour as descriptions also allows them to be more easily extended, exported or re-interpreted.

Watch this space for new commits shortly :)

---

## String Theory

String Theory &mdash; unlike its scientific namesake &mdash; has nothing to do with attempting to explain ultra-reallity, but instead everything to do with describing JavaScript structures. Initially built as a simple shorthand for navigating objects, the code has now been generalised to allow for construction of bespoke parser systems.

An example of `theory.string()` in use would be when using {@linkcode theory.navigate t.navigate}.

    t.navigate(myObject).select('c/^e/($keyContains f)');

The path notation used above is parsed using String Theory. The parsing generates an internal object structure that is then used to navigate an Object structure.

### Creating a parser

Parsers are created by providing instruction sets for {@linkcode theory.string t.string} to use. Here is an cut-down set for parsing Theory's method overload keys:

    theory.string.instructions('t-key', {
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

> NOTE: For now only string tokens are supported, but the future should see Regular Expressions and ES6 support for string tokens.

For further information see the documentation at {@linkcode theory.string t.string}.

### Performance

It should be noted that `t.string` cannot, and will not, attempt to compete &mdash; in terms of performance &mdash; with actually coding your own lexical/parser system. What `t.string` is attempting to do is to make this process quicker and easier to accomplish. It never pays to optimise early, and if you can sketch out your idea quickly (and safely) directly in code, you can get your project up and running far faster. If whatever you have built suddenly becomes popular, or requires heavy optimisation, you can always switch out `t.string` for something more tailored. Especially as the interface i.e. a string of encoded information, will be implementation agnostic.

---

## Object Theory

... Unfortunately is still under development at the moment.

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
      '</div>',
    '</nav>',
    '<hr >'
  ].join("\n") + elm.innerHTML;
})(document.getElementById('readme'));
</script>