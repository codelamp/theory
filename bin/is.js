"use strict";

/**
 * Check stuff has particular attributes
 *
 * @namespace has
 */
var has = {
  
  /**
   * Check that an object has at least one callable function contained within its own properties.
   *
   * @static
   * @method has.childFunctions
   * @param {Object} desc The object to be scanned for callable items.
   * @return {Boolean} True, if item has any `is.callable()` items of its content filtered by `hasOwnProperty()`
   * @return {String} almost never, except if you manually edit the content of this function.
   * @see is.what
   */
  childFunctions: function(desc){
    for ( var i in desc ) {
      if ( desc.hasOwnProperty(i) ) {
        if ( is.callable(desc[i]) ) {
          return true;
        }
      }
    }
    return false;
  }
  
};

/**
 * A simple place to store code that casts or converts from one thing to another.
 *
 * @namespace to
 */
var to = {
  
  /**
   * Cast "anything" to an array.
   *
   * Makes use of modern approaches where possible i.e. `Array.isArray` and `Array.from`.
   *
   * Falls back to `Array.prototype.slice.call`.
   *
   * @example
   * to.array();          // []
   * to.array(123);       // [123]
   * to.array([123]);     // [123]
   * to.array('123');     // ['1', '2', '3']
   * to.array(arguments); // [arguments[0], arguments[1], arguments[2]]
   *
   * @memberof! to
   * @method
   * @param {any} param - if param is already an array, it is just returned, anything else that can be converted is; anything else is just wrapped.
   * @return {array}
   */
  array: function(param){
    if ( param ) {
      /// check for array type first to short-circuit: modern first, then old-school
      if ( Array.isArray ) {
        if ( Array.isArray(param) ) {
          return param;
        }
      }
      else {
        if ( param.join ) {
          return param;
        }
      }
      /// as long as we have a length property, use casting: modern first, then old-school
      if ( param && typeof param.length != 'undefined' ) {
        if ( Array.from ) {
          return Array.from(param);
        }
        else {
          return Array.prototype.slice.call(param, 0);
        }
      }
    }
    /// otherwise, wrap the value as an array
    return arguments.length ? [param] : [];
  },
  
  /**
   * Convert "anything" to a function
   *
   * @example
   * to.function(function(){}); // function(){} <-- same ref
   * to.function(123);          // function(){ return param; } <-- param = 123
   *
   * @memberof! to
   * @method
   * @param {any} param - if param is already a function, it is just returned, anything else is wrapped as a function.
   * @return {function}
   */
  "function": function(param){
    if ( param && param.call && param.apply ) {
      return param;
    }
    else {
      return function(){ return param; };
    }
  }
  
};

/**
 * Check that stuff is what it should be, or perhaps not what it isn't.
 *
 *     if ( is.string(randomVariable) ) {
 *       /// do something here?
 *     }
 *     else if ( is.not.array(randomVariable) ) {
 *       /// do something else?
 *     }
 *
 * The current definition of "is" methods are integral to theory.js. You 
 * can change their behaviour but this may cause theory code to do strange 
 * and unimaginable things -- it could also just cause it to error and throw 
 * wobblies all the time too.
 *
 * This is the reason for `is.what.type()` -- this is a system designed
 * to be used by external code. The way items are identified can be
 * changed without causing internal theory issues.
 *
 *     if ( is.what.type(randomVariable, 'string' ) {
 *       /// you can change how string is compared by redefining the `is.what.types` array
 *     }
 *
 * Obviously, it is unlikely that you would alter or even use `is.what.type` 
 * for simple types -- you may as well use `is.string`.
 *
 * However `is.what.type` can be extended to cater for any type detection.
 *
 * ##### TODOs
 * 1. introduce namespacing to `is` so that separate code in the same environment cannot intefere.
 *
 * @namespace is
 * @todo: introduce namespacing to `is` so that separate code in the same environment cannot intefere.
 */
var is = (function( undefined ){
  
  var is = {
  
    /**
     * Check that an item quacks like an array.
     *
     * @static
     * @method is.array
     * @param {any} item
     * @return {Boolean} returns true if item has `.join` method
     */
    array: function(item){
      return (item && item.join) ? true : false;
    },
    /**
     * Check that an item is "array like", meaning that it can most likely be treated
     * in the simplest sense as an array. This does not cover checking that it supports 
     * array methods i.e. like `slice` or `push`; just the fact that the object has a 
     * numeric key structure i.e. `item[0]`, and `.length`
     *
     * This will fail for array-likes that are empty -- this is because we can only
     * check that `.length` is a number -- which is far too open. A special case 
     * is made for an arguments object, because we can detect those by checking `.toString()`.
     *
     * I fully expect this method to be expanded as this code encounters other 
     * array-likes, e.g. node lists.
     *
     * @method is.arraylike
     * @param {any} item
     * @return {Boolean} returns true if item has `.length` and `[0]`, or `is.array()`, or `is.arguments()`
     */
    arraylike: function(item){
      return ((item && item.length && typeof item[0] !== 'undefined')
        || is.array(item)
        || is.arguments(item))
      ? true : false;
    },
    /**
     * Check that an item is an `Arguments` object.
     *
     * @static
     * @method is.arguments
     * @param {any} item
     * @return {Boolean} returns true if item has `.length` that is a number and reports
     * as `[object Arguments]` when `.toString()-ed`.
     */
    arguments: function(item){
      return item && is.number(item.length) && (Object.prototype.toString.call(item) === '[object Arguments]') ? true : false;
    },
    /**
     * Check that an item quacks like a string.
     *
     * @static
     * @method is.string
     * @param {any} item
     * @return {Boolean} returns true if item has .charAt method
     */
    string: function(item){
      return (typeof item != 'undefined' && item.charAt) ? true : false;
    },
    /**
     * Check that an item reports as a number.
     *
     * @static
     * @method is.number
     * @param {any} item
     * @return {Boolean} returns true if item is `typeof number` (or has been constructed by `Number`)
     */
    number: function(item){
      return ((typeof item == 'number') || (item && item.constructor === Number)) ? true : false;
    },
    /**
     * Check that an item reports as a boolean.
     *
     * @static
     * @method is.bool
     * @param {any} item
     * @return {Boolean} returns true if item is `typeof boolean` (or has been constructed by `Boolean`)
     */
    bool: function(item){
      return ((typeof item == 'boolean') || (item && item.constructor === Boolean)) ? true : false;
    },
    /**
     * Check that an item reports as a literal object, in the sense that it has been constructed
     * directly by `{}`.
     *
     * @static
     * @method is.literalObject
     * @param {any} item
     * @return {Boolean} returns true if item has a `.constructor` of Object
     */
    literalObject: function(item){
      return (typeof item === 'object') && (item.constructor === Object) ? true : false;
    },
    /**
     * Check that an item is an object. In JavaScript this is almost pointless.
     *
     * @static
     * @method is.object
     * @param {any} item
     * @return {Boolean} returns true if item reports as `typeof object`
     */
    object: function(item){
      return (typeof item === 'object');
    },
    /**
     * Check that an item is callable.
     *
     * @static
     * @method is.callable
     * @param {any} item
     * @return {Boolean} returns true if the item has `.call` and `.apply` methods
     */
    callable: function(item){
      return (item && item.call && item.apply) ? true : false;
    },
    /**
     * Check that an item quacks like an element.
     *
     * @static
     * @method is.element
     * @param {Element} item
     * @return {Boolean} returns true if the item has getElementsByTagName
     */
    element: function(item){
      return !!item.getElementsByTagName;
    },
    /**
     * Check that an item is a stored version of undefined. Stored because
     * JavaScript allows a local variable to be created called "undefined"
     * which will override the value. Obviously this doesn't avoid any 
     * changes made to undefined before is.js is evaluated.
     *
     * @static
     * @method is.undefined
     * @param {any} item
     * @return {Boolean} returns true if the item === a stored version of undefined
     */
    undefined: function(item){
      return item === undefined;
    },
    /*
     * See undefined, but reverse your thinking.
     *
     * @static
     * @method is.defined
     * @param {any} item
     * @return {Boolean} returns true if the item !== a stored version of undefined
     */
    defined: function(item){
      return item !== undefined;
    },
    /**
     * Check that an item quacks like a promise.
     *
     * @static
     * @method is.promise
     */
    promise: function(item){
      return !!item && !!item.then;
    },
    /**
     * Check that an item is null. This really is just for nice readability.
     *
     * @static
     * @method is.null
     * @param {null} item
     * @return {Boolean} returns true if item === null
     */
    "null": function(item){
      return item === null;
    },
    /**
     * Check that item is a range of null values.
     *
     * @static
     * @method is.void
     * @param {null|undefined|NaN} item
     * @return {Boolean} returns true if item is NaN, undefined or null.
     */
    "void": function(item){
      return (typeof item === 'number') && isNaN(item) || (item === undefined) || (item === null);
    },
    /**
     * Check that an item is specifically the type NaN.
     *
     * @static
     * @method is.NaN
     * @param {NaN} item
     * @return {Boolean} returns true if item reports as a number, but is also isNaN.
     */
    "NaN": function(item){
      return (typeof item == 'number') && isNaN(item);
    },
    /**
     * A primitive accounts for numbers, booleans, strings, undefined, NaN and null
     *
     * @static
     * @method is.primitive
     * @param {any} item
     * @return {Boolean} returns true if item reports as not being typeof object
     */
    primitive: function(item){
      return (typeof item !== 'object');
    },
    /**
     * A primitive object accounts for primitives that have been wrapped with 
     * their object counterpart
     *
     * @static
     * @method is.primitiveObject
     * @param {any} item
     * @return {Boolean} returns true if item is typeof an object, but its valueOf() reports as not being an object.
     */
    primitiveObject: function(item){
      return (typeof item === 'object') && !!item.valueOf && typeof item.valueOf() !== 'object';
    },
    /**
     * A simple test against the current, or passed in hostname -- I'm not sure
     * why this is here? I guess something used to use it... will have to find it.
     *
     * Accepts a list of locations to test. If a location starts with a dot, then
     * it will be an ends with match. If no dot, then it will be a starts with match.
     *
     * @static
     * @method is.hostname
     * @param {Array|String} locations
     * @param {String} hostname
     * @return {Boolean} returns true if a match is found between a location and hostname.
     */
    hostname: function(locations, hostname){
      !hostname && (hostname = String(window.location.host));
      !locations && (locations = []);
      if ( is.string(locations) ) { locations = [locations]; }
      for ( var p, a=locations, i=0, l=a.length, h=hostname; i<l; i++ ) {
        if ( (p = h.indexOf(a[i])) != -1 ) {
          /// if we have a dot, use an ends with match.
          if ( a[i].charAt(0) === '.' ) {
            return (p === h.length - a[i].length);
          }
          /// otherwise treat starts with match
          else if ( p === 0 ) {
            return true;
          }
        }
      }
      return false;
    },
    /**
     * Check to see if html, when parsed by the browser, doesn't change
     *
     * @static
     * @method is.markupNormalized
     * @param {String} markup
     * @return {Boolean} returns true if the mark was normalised.
     */
    markupNormalized: function(markup){
      return t.normalizeMarkup(markup) === markup; ///@TODO: This depends on theory.js
    },
    /**
     * The obligatory search for emptiness. Basically tests to see if an item is "empty"
     * Where emptiness can mean different things for different types.
     *
     * @static
     * @method is.empty
     * @param {any} item
     * @return {Boolean} returns true if deemed empty
     */
    empty: function(item){
      if ( !item ) return true;
      if ( is.number(item.length) ) {
        return !item.length;
      }
      else if ( is.primitive(item) ) {
        return !item;
      }
      //else if ( is.primitiveObject(item) ) {
      //  return !item.valueOf();
      //}
      else {
        for ( var key in item ) {
          if ( !Object.prototype.hasOwnProperty || Object.prototype.hasOwnProperty.call(item, key) ) {
            return false;
          }
        }
        return true;
      }
    },
  
    /**
     * You always have to know where (and what) your towel is.
     *
     * @static
     * @method is.towel
     * @param {any} item
     * @return {Boolean} returns true if you know what six times nine is.
     */
    towel: function(item){
      return item === 42;
    }
  
  };
  
  var i, createNot = function(method){
    return function(){ return !method.apply(this, arguments); };
  };
  
  is.not = {};
  for ( var i in is ) { is.not[i] = createNot(is[i]); }
  
  return is;

})( undefined );

/**
 * Determines what has been passed as `desc`, up to a certain depth. 
 * 
 * This uses the {@linkcode is.what.type} method to determine types, but 
 * the `depth` parameter exists to help when describing arrays.
 *
 * For example, if you pass the following:
 *
 *     is.what.type([123, 'test']);
 *
 * This will report `array` rather than the `number, string` you might've
 * been hoping for. Instead use:
 *
 *     is.what([123, 'test'], 1); // ['number', 'string']
 *     is.what([123, 'test']);    // 'array'
 *
 * The code automatically describes the outer-wrapping array using `[]`
 * mainly to dovetail nicely with {@linkcode theory.overload}. It also
 * means that the actual structure is still described, just with symbols
 * rather than words.
 *
 * ##### notes
 *
 * > The `depth` parameter does not apply to objects.
 *
 * @static
 * @memberof! is
 * @method is.what
 * @param {Object} desc
 * @param {Number} [depth=0]
 * @return {String} returns a string describing what was passed in as `desc`
 */
is.what = function(desc, depth){
  if ( depth > 0 ) {
    if ( is.arraylike(desc) ) {
      for ( var a=[], i=0, d=depth-1, l=desc.length; i<l; i++ ) {
        a.push(this.what(desc[i], d));
      }
      return '[' + a.join(', ') + ']';
    }
  }
  return is.what.type(desc);
};

/**
 * Easily overriddddable type descriptions
 *
 * @static
 * @property is.what.types
 */
is.what.types = [
  {name: 'string',   cons: String},
  {name: 'number',   cons: Number},
  {name: 'boolean',  cons: Boolean},
  {name: 'date',     cons: Date},
  {name: 'regexp',   cons: RegExp},
  {
    name: 'function',
    test: function(obj,t,c){
      return 0 ||
        (c === Function) || 
        (t === 'function') || 
        (obj.call && !!obj.apply)
      ;
    }
  },
  {
    name: 'callable',
    test: function(obj,t,c){
      return (obj.call && !!obj.apply);
    }
  },
  {
    name: 'array',
    test: function(obj,t,c){
      return 0 ||
        (c === Array) ||
        (t === 'array') ||
        (obj.join && obj.slice && !!obj.unshift) ||
        (obj[0] && typeof obj.length !== 'undefined') ||
        (is.arguments(obj))
      ;
    }
  },
  {
    name: 'event',
    test: function(obj,t,c){return !!(obj.type && (obj.target||obj.srcElement));}
  },
  {
    name: 'element',
    test: function(obj,t,c){return !!obj.getElementsByTagName;}
  },
  {
    name: 'document',
    test: function(obj,t,c){return !!obj.getElementById;}
  },
  {
    name: 'window',
    test: function(obj,t,c){return obj.location && !!obj.document;}
  }
];

/**
 * This is the code Theory exposes to allow external code to modify
 * how types are recognised, mainly for use with the 
 * {@linkcode theory.overload} method. By default it utilises a 
 * mixture of typeof and duck testing to best guess the type of an
 * object.
 *
 * With one parameter it returns a description string, but 
 * with two or more the code will test the found type against
 * each subsequent comparison parameter. If a match is found against
 * any of the comparisons, the method will return `true` otherwise
 * `false`.
 *
 * To add or change the way a type is identified, you just need to
 * change the `is.what.types` array.
 *
 * If the `obj` you are testing supports an `isWhatType` method
 * the code will use this first and foremost, falling back to the
 * `is.what.types` array checks.
 *
 * The method can be called one of two ways:
 * 
 * @example
 * is.what.type({anObject:1});             // 'object'
 * is.what.type('a chain of characters');  // 'string'
 * is.what.type([123]);                    // 'array'
 *
 * @example
 * is.what.type({anObject:1}, 'object');          // true
 * is.what.type({anObject:1}, 'object', 'array'); // true
 * is.what.type(123, 'object', 'array');          // false
 *
 * @static
 * @memberof! is
 * @method is.what.type
 * @param {Any} obj
 * @param {...String} [comparison]
 * @return {String} A string describing `obj` if no comparison has been provided i.e. `array`, 'string' or `function`.
 * @return {Boolean} A boolean if the description of `obj` matches any of the provided comparison strings.
 */
is.what.type = function(obj, comparison){
  var t,i,c,k,l,e;
  if ( obj && obj.isWhatType ) {
    t = obj.isWhatType();
  }
  else {
    if ( (t = typeof obj) !== 'undefined' ) {
      c = obj.constructor;
      k = is.what.types;
      l = k.length;
      for (i=0; i<l; i++) {
        if ( (e=k[i]) && e.cons ) {
          if (c === e.cons) {
            t = e.name; break;
          }
        }
        else if ( e && e.test ) {
          if ( e.test(obj,t,c) ) {
            t = e.name; break;
          }
        }
      }
    }
  }
  if ( comparison && comparison.substr ){
    if ( (l=arguments.length) > 2 ){
      for ( i=1; i<l; i++ ) {
        if ( t === arguments[i] ){
          return true;
        }
      }
      return false;
    }
    return type === t;
  }
  return t;
};


/// @TODO: a new run.later implementation?
var trigger = {
  
  later: function(){ /// setTimeout n
    
  },
  
  next: function(){ /// setTimeout 0
    
  },
  
  after: function(){ /// setInterval to watch for change
    
  },
  
  every: function(){ /// setInterval n
    
  }
  
};