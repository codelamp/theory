"use strict";

/**
 * The main theory object.
 *
 * There are three aims to theory.js:
 *
 * 1. Take the power of selection and go further than just the DOM.
 * 2. Allow strings to describe objects.
 * 3. Allow objects to describe strings, and other objects.
 * 4. Allow combined object and string descriptions to make powerful systems from simple rules.
 *
 * Everything else that is built-in to theory is required to achieve
 * the above aims in a stand-alone capacity.
 *
 * @namespace
 * @author Phil Glanville
 */
var theory, t;

/*
 * Very useful polyfills
 */
if (!Function.prototype.bind) {
  /*
   * Function.prototype.bind() may not be required if t.bind() exists
   */
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') { throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable'); }
    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP    = function() {},
        fBound  = function() {
          return fToBind.apply(this instanceof fNOP && oThis
            ? this
            : oThis,
              aArgs.concat(Array.prototype.slice.call(arguments)));
        };
    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();
    return fBound;
  };
}

if (!Function.create ) {
  /*
   * Function.create(), create a clone of a function -- with its extended properties
   */
  Function.create = function(src){
    var dst = t.extend(function(){ return src.apply(this, arguments); }, src);
    /// @TODO: this needs to be looked at, as it probably should only apply to instances??
    dst.isPrototypeOf = function(test){ return src.isPrototypeOf(test); };
    return dst;
  };
}

t = {
  global: this || (function(){return this;})()
};

/*
 * Early theory stuff that is shared by everything, even later theory stuff in this file
 */
theory = t = {
  /**
   * Retain a reference to the global scope where theory.js was evaluated.
   *
   * @memberof! theory
   * @type {Object}
   */
  global: t.global,
  /**
   * Retain a reference to `undefined` when theory.js was evaluated, to avoid it being hijacked.
   *
   * @memberof! theory
   * @type {Object}
   */
  undefined: undefined,
  /**
   * Simple logging wrapper that checks for console existence before use.
   *
   * @memberof! theory
   * @method
   */
  log: function(obj, name){
    name && console.groupCollapsed(name);
    console.dir && console.dir(obj);
    name && console.groupEnd();
  },
  /**
   * Extend `a` with properties in `b`, with optional `options`.
   *
   * @memberof! theory
   * @method
   * @param {Object} a Destination object
   * @param {Object} b Source object
   * @param {Object} [options] Modify the behaviour with options
   * @param {Boolean} [options.overwrite] Properties in `b` that collide in `a` will overwrite.
   * @param {Boolean} [options.debug] Output the keys found in `b` as we go.
   */
  extend: function(a, b, options){
    for ( var i in b ) {
      if ( a[i] === undefined || (options && options.overwrite) ) {
        if ( options && options.debug ) { console.log(i); }
        if ( options && options.each ) {
          a[i] = options.each(b[i], i);
        }
        else {
          a[i] = b[i];
        }
      }
      else {
        t.extend(a[i], b[i]);
      }
    }
    return a;
  },
  
  /**
   * Temporary function to handle errors, currently just throws them for now.
   *
   * @memberof! theory
   * @method
   * @param {Error} e The `Error()` object to handle.
   * @return {Void} This function throws an error, so does not return anything.
   */
  error: function(e){
    throw e;
  },
  
  /**
   * Create a wrapped method. The function passed as `method` is expected to return a closure. 
   * It is the closure that will actually be returned by this code, keeping the `wrapper` object
   * trapped within its scope.
   *
   * You can specify an optional context for the wrapper to be called with, otherwise it'll
   * default to `t.global`.
   *
   * @memberof! theory
   * @type {Function}
   * @param {Function} method
   * @param {Object} wrapper
   * @param {Any} [context=t.global]
   * @return {Function}
   * @example
   *     var a = t.wrapper(function(data){
   *       return function(){
   *         return data.wrappedInfo;
   *       };
   *     },{
   *       wrappedInfo: 'that will be trapped in scope'
   *     });
   *     
   *     a(); /// 'that will be trapped in scope'
   */
  wrapper: function(method, wrapper, context){
    var args;
    if ( wrapper && wrapper.join ) {
      args = wrapper;
    }
    else if ( wrapper ) {
      args = [wrapper];
    }
    if ( method && method.apply ) {
      return method.apply(context||t.global, args||[{}]);
    }
    return null;
  },
  
  /**
   * Create a method with some special abilities:
   *
   * 1. Add attributes to the method, treating the function as an object.
   * 2. Implement argument overloading.
   * 3. Implement arguments translating to an args object.
   * 4. Add a `.clone()` method to the function, for easy duplication.
   *
   * @memberof! theory
   * @method
   * @param {Object} desc An object that describes the desired method behaviour.
   * @param {Object} context
   * @param {Object} attribute
   * @return {Function} A formulated method that handles requested abilities and ultimately calls any code passed in via `desc`.
   *
   * @todo expose the description object in some way from the returned method, although don't call it ".description" because that interfered with the `.namespace()` code 
   */
  method: function(desc, context, attribute){
    var method, argsToArray = Array.prototype.slice, argsHandler;
    if ( desc.defaults ) {
      argsHandler = function(args){
        args = argsToArray.call(args, 0);
        /// if we have an array of defaults
        if ( desc.defaults.length ) {
          while ( args.length <= desc.defaults.length ) {
            args[args.length] = desc.defaults[args.length];
          }
        }
        return args;
      };
    }
    if ( desc.call ) {
      method = function(){
        var args = argsHandler ? argsHandler(arguments) : arguments;
        return desc.call.apply(context||this, args);
      };
      //method.toSource = function(){
      //  return String(desc.call);
      //};
    }
    /// @TODO: call or method? choose one!
    else if ( desc.method ) {
      if ( is.callable(desc.method) ) {
        method = function(){
          var args = argsHandler ? argsHandler(arguments) : arguments;
          return desc.method.apply(context||this, args);
        };
      }
      else {
        
      }
    }
    else if ( desc.overloads ) {
      method = t.overload(desc.overloads);
    }
    if ( desc.attributes ) {
      method = t.extend(method, desc.attributes, { overwrite: true });
    }
    if ( method ) {
      /// create a cloned method based on the original description
      method.clone = function(context2){ return t.method(desc, context2||context); };
    }
    else {
      throw new Error('method failed creation. ' + JSON.stringify(desc));
    }
    /// process after everything else is setup
    if ( is.callable(desc.after) ) {
      desc.after(desc);
    }
    return method;
  },
  /**
   * A wrapped implementation of defineProperty.
   *
   * @memberof! theory
   * @method
   */
  define: function(context, attribute, desc){
    if ( !Object.defineProperty ) return false;
    Object.defineProperty(context, attribute, desc);
  },
  
  /*
   * Simple binding method
   *
   * @memberof! theory
   * @method
   */
  bind: function( method, context ){
    var f = function(){
      return method.apply(context||this, arguments);
    };
    /// @TODO: should we honor additional attributes on functions here?
    f.bound = method;
    return f;
  },
  
  /**
   * Bind a group of items to one context
   *
   * @memberof! theory
   * @method
   */
  bindCollection: function( collection, context, collect ){
    var i, bound = collect || {};
    for ( i in collection ) {
      if ( collection.hasOwnProperty ) {
        if ( collection.hasOwnProperty(i) && is.callable(collection[i]) ) {
          bound[i] = t.bind(collection[i], context);
        }
      }
      else if ( is.callable(collection[i]) ) {
        bound[i] = t.bind(collection[i], context);
      }
    }
    return bound;
  },
  
  /*
   * Bind layered collections all at once.
   *
   * @memberof! theory
   * @method
   * @todo this needs implentation -- or deletion.
   */
  bindCollectionRecursive: function(){},
  
  /**
   * Unbind a specific bound method, bound by t.bind
   *
   * @memberof! theory
   * @method
   */
  unbind: function( method ){
    if ( method.bound ) {
      return method.bound;
    }
  },
  
  
  /*
   * make a primitive into a primitive object
   *
   * @TODO: Look into whether this is needed any more, it may be that
   * assignement to the primitive will create a primitive object.
   *
   * @TODO: Support for undefined, NaN and null.
   */
  promotePrimitive: function(o){
    var po = o;
    switch ( typeof o ) {
      case 'number':  po = new Number(o); break;
      case 'boolean': po = new Boolean(o); break;
      case 'string':  po = new String(o); break;
    }
    if ( po !== o ) {
      po.original = o;
    }
    return po;
  },
  
  /*
   * Simple code to step along an object structure
   * without tripping warnings.
   */
  step: function(obj){
    if ( !obj ) return null;
    for ( var i=1, a=arguments, l=a.length; obj && (i<l); i++ ) {
      obj = obj[a[i]];
    }
    return obj;
  },
  
};

/**
 * Simplistic, and pretty fast, but most of all readable function "overloading".
 *
 * @memberof! theory
 * @namespace
 */
theory.overload = t.method({
  /**
   *
   * ##### Inner workings
   *
   * The resulting method returned uses a lookup object to match calling 
   * arguments to a destination function. So the main overhead with 
   * this approach is the type checking on each argument.
   *
   * The type checking is performed by {@linkcode is.what.type}
   *
   * ##### Named parameters
   *
   * When introducing named parameters there is an extra overhead, whereby
   * the arguments array is translated to an object with named keys. But
   * whilst this is extra processing, it can make your resulting function
   * much nicer to work with.
   *
   * @todo optimisations could be implemented in terms of argument counts.
   *
   * @example
   * method = t.overload({
   *   '[array]': function(list){
   *     // simple overload based on types
   *   },
   *   '[array, object]': function(list, options){
   *     // each denoted function will only be called if types match
   *   }
   * });
   *
   * @example
   * method = t.overload({
   *   '[array] [object]?': function(list, options){
   *     // overload with optional arguments
   *   },
   *   '[object] [number]?': function(list, delay){
   *     // this creates lookups for [array], [array, object], [object] and [object, number]
   *   }
   * });
   *
   * @example
   * method = t.overload({
   *   '[array:list]': function(args){
   *     // simple named overloads
   *   },
   *   '[array:list, object:options]': function(args){
   *     // arguments are translated to an object with named keys
   *     // i.e. args.list, args.options
   *   }
   * });
   *
   * @memberof! theory.overload
   * @method ___callable
   * @param {object} desc - The overload description object
   */
  method: function(desc, argsHandler){
    var self = this.overload, func = self.fallback;
    if ( is.array(desc) ) {
      func = self.usingList.apply(self, arguments);
    }
    else if ( desc && desc.method ) {
      func = self.usingObject.apply(self, arguments);
    }
    else {
      func = self.usingKeys.apply(self, arguments);
    }
    return func;
  },
  attributes: {
    usingObject: function(desc, argsHandler){
      console.log(123, desc); /// <--------------- 
    },
    /*
     * This version of t.overload expects each version of the method as
     * an element of an array.
     *
     *  E.g. [
     *    {
     *      arguments: '[array, number]',
     *      method: function(args){
     *        console.log(args);
     *      }
     *    },
     *    {
     *      defaults: [0, []],
     *      arguments: '[number, array]',
     *      method: function(args){
     *        console.log(args);
     *      }
     *    }
     *  ]
     */
    usingList: function(desc, argsHandler){
      console.log(desc);
    },
    /*
     * This version of t.overload expects each version of the method as
     * keys within an object.
     *
     *  E.g. {
     *    "[object, string]" : function(){},
     *    "[number, array]" : function(){},
     *  }
     */
    usingKeys: function(desc, argsHandler){
      var key, a, i, l, func, internal = {};
      /// apply desc processors
      for ( a=t.overload.descProcessors, i=0, l=a.length; i<l; i++ ) {
        a[i].call(this, desc, internal);
      }
      internal = {}
      /// apply the item processors in order
      for ( key in desc ) {
        if ( desc.hasOwnProperty(key) ) {
          for ( a=t.overload.itemProcessors, i=0, l=a.length; i<l; i++ ) {
            a[i].call(this, key, desc, internal);
          }
        }
      }
      /// return the actual function that will handle the overloading
      func = function(){
        var args = argsHandler ? argsHandler(arguments) : arguments,
            key = is.what(args, 1),
            item = desc[key]
        ;
        //console.log(desc);
        if ( item ) {
          return t.overload.callItem(desc, item, this, args);
        }
        throw new Error('Overload failed for ' + key);
      };
      func.overloader = desc;
      return func;
    },
    
    fallback: function(){
      throw new Error('overload failed to form correctly.');
    }
  }
  
});

/**
 * Take an object and clone it shallow or deep.
 *
 * @example
 * var a = {a:{b:{c:123}}}, b = t.clone(a);
 * console.log(a === b, a.a === b.a); // false, true
 *
 * @example
 * var c = t.clone(a, true);
 * console.log(a === b, a.a === c.a, a.a.b.c === c.a.b.c); // false, false, false
 *
 * @memberof! theory
 * @method
 */
theory.clone = t.method({
  hint: 't.clone',
  defaults: [null, false, 0],
  required: [true],
  method: function(obj, deep, level){
    if ( is.void(obj) ) { obj = this; } /// @TODO: default deep?
    var key, dup;
    if ( !level || (deep && deep.call && deep.call(obj, obj, level)) || deep === true || (is.number(deep) && (deep < level)) ) {
      switch ( true ) {
        //
        case is.element(obj):
          dup = obj.cloneNode();
        break;
        //
        case is.object(obj):
          if ( is.bool(obj) ) { dup = new Boolean(obj); }
          else if ( is.number(obj) ) { dup = new Number(obj); }
          else if ( is.string(obj) ) { dup = new String(obj); }
          else if ( is.literalObject(obj) ) { dup = {}; }
          else {
            try { console.warn('unable to clone', obj); } catch(ex){};
            throw new Error('unable to clone object, see console for details.');
          }
          for ( key in obj ) {
            if ( !Object.prototype.hasOwnProperty || Object.prototype.hasOwnProperty.call(obj, key) ) {
              if ( level < 10 ) {
                dup[key] = t.clone(obj[key], deep, level+1);
              }
            }
          }
        break;
        //
        case is.array(obj):
          dup = [];
          for ( key=0, l=obj.length; key<l; key++ ) {
            dup.push(t.clone(obj[key], deep, level+1));
          }
        break;
        //
        default:
          dup = obj;
        break;
  
      }
    }
    else {
      dup = obj;
    }
    return dup;
  }
});

/*
 * Borrow -- allows functionality of other objects to be attached
 * elsewhere.
 *
 *   E.g. Borrow all the "own keyed" values from a to b
 *   
 *   t.borrow().all()
 *     .from(a)
 *     .giveTo(b)
 *   ;
 *
 *   E.g. Proxy and bind array methods 'push' and 'shift' on to another object.
 *
 *   var b = { list:[] };
 *
 *   t.borrow('push', 'shift')
 *     .preserveContext()
 *     .from(b.list)
 *     .giveTo(b)
 *   ;
 *
 *   E.g. Or actually use the array methods from the context of b
 *
 *   var b = {};
 *
 *   t.borrow('push', 'shift')
 *     .from(Array.prototype)
 *     .giveTo(b)
 *   ;
 */
t.borrow = t.wrapper(function(){
  var borrow = {
    i: {
      all: null,
      src: null,
      dst: null,
      ctx: null,
      items: null
    },
    from: function(source){
      this.i.src = arguments.length > 1 ? arguments : [source];
      return this;
    },
    all: function(v){
      this.i.all = (arguments.length && !v) ? false : 1;
      return this;
    },
    allOwn: function(v){
      this.i.all = (arguments.length && !v) ? false : 2;
      return this;
    },
    preserveContext: function(){
      this.i.ctx = true;
      return this;
    },
    withContext: function(context){
      this.i.ctx = context;
      return this;
    },
    giveTo: function(dest, modifier){
      this.i.dst = arguments.length > 1 ? arguments : [dest];
      this.apply(modifier);
      return this;
    },
    not: function(){
      /// @TODO: need to not()
      return this;
    },
    applyItem: function(obj, key, val, modifier){
      if ( modifier ) {
        val = modifier(obj, key, val);
      }
      /// create our borrowed item in terms of context
      if ( val && val.bind ) {
        val = this.i.ctx ? val.bind(this.i.ctx === true ? obj : this.i.ctx) : val;
      }
      /// shortcut for one destination
      if ( this.i.dst.length == 1 ) {
        this.i.dst[0][key] = val;
      }
      else {
        /// long cut for multiple dests
        /// step and apply to each destination
        for ( var a=this.i.dst, l=a.length, i=0, r; (r=a[i]),(i<l); i++ ) {
          r[key] = val;
        }
      }
    },
    apply: function(modifier){
      var r,a,i,l, rr,aa,ii,ll, m;
      if ( this.i.all ) {
        for ( a=this.i.src, l=a.length, i=0; (r=a[i]),(i<l); i++ ) {
          for ( aa in r ) {
            if ( this.i.all === 1 || Object.prototype.hasOwnProperty.call(r, aa) ) {
              if ( (m=r[aa]) ) {
                this.applyItem(r, aa, m, modifier);
              }
            }
          }
        }
      }
      else if ( this.i.items ) {
        for ( a=this.i.items, l=a.length, i=0; (r=a[i]),(i<l); i++ ) {
          /// step each source until we find the item to borrow
          for ( aa=this.i.src, ll=aa.length, ii=0; (rr=aa[ii]),(ii<ll); ii++ ) {
            if ( (m=rr[r]) ) {
              this.applyItem(rr, r, m, modifier);
            }
          }
        }
      }
      return this;
    }
  };
  /// the actual function returned
  return function(first){
    var obj = Object.create(borrow);
        obj.i = Object.create(obj.i);
        obj.i.items = (first && first.join) ? first : arguments;
    return obj;
  };
});

/*
 * ExpReg 0.1
 *
 *  ExpReg is just a simple RegExp wrapper that has some useful functions
 *  for dealing with Regular Expressions.
 */
t.ExpReg = t.wrapper(function(){
  /*
   * The outer wrapping constructor that will be exposed as ExpReg
   */
  var ExpReg = function(re, haystack){
    var t, exp;
    if ( this instanceof ExpReg ) {
      this.exp = ExpReg.expression(re);
      if ( this.exp ) {
        this.source = haystack ? haystack : '';
        this.matches = [];
        this.matched = false;
        this.finished = false;
        this.reversed = false;
      }
      else {
        throw new Error('unable to parse ExpReg expression.');
      }
    }
    else {
      if ( typeof this == 'string' ) {
        return new ExpReg(re, String(this));
      }
      else {
        return new ExpReg(re, haystack);
      }
    }
  };
  /*
   * Needed to reverse engineer a RegExp into constituent parts
   */
  ExpReg.unwrapPattern = new RegExp('^([^a-z0-9\s])(.+?)\\1([gimy]{0,4})$','i');
  /*
   * Take a string representation or an actual RegExp object and rebuild
   * it as two expressions. One with the global flag (.multiple), and one without (.single).
   * This is to work around the behavioural differences in RegExp functionality
   * when dealing with either a global or non-global expression.
   */
  ExpReg.expression = function(exp){
    var bits, obj = {};
    if ( (bits=ExpReg.unwrapPattern.exec(String(exp))) ) {
      obj.string = bits[2];
      obj.flags = bits[3];
      obj.flagsNoGlobal = obj.flags.replace('g', '');
      obj.flagsGlobal = obj.flags.replace('g', '') + 'g';
      obj.single = new RegExp(obj.string, obj.flagsNoGlobal);
      obj.multiple = new RegExp(obj.string, obj.flagsGlobal);
      return obj;
    }
    else {
      return null;
    }
  };
  /**
   * Quick quote function, borrowed from regexp-quote.js
   */
  ExpReg.quote = function(str){
    return str.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
  };
  /*
   * Simple jQuery like attr function
   * DEPRECATED: This can no longer work as we have two expressions
   * one global, one not.
   */
  /*
  ExpReg.prototype.attr = function( name, value ){
    if ( arguments.length == 2 ) {
      this.exp[name] = value;
    }
    else {
      return this.exp[name];
    }
  };
  */
  /*
   * Define the haystack that the RegExp will search
   */
  ExpReg.prototype.haystack = function(string){
    if ( arguments.length && (typeof string == 'string') ) {
      this.source = string;
      this.matched = false;
      return this;
    }
    else {
      return this.source;
    }
  };
  /*
   * Return a particular matched item. A matched item will
   * be an object that contains a zero-indexed array of .groups 
   * and an .offset property that gives the start of where the 
   * match was found.
   */
  ExpReg.prototype.item = function(n){
    if ( arguments.length == 0 || n === undefined || n === null ) {
      return this.matches;
    }
    else if ( n < 0 ) {
      return this.matches[this.matches.length+n];
    }
    else if ( n < this.matches.length ) {
      return this.matches[n];
    }
    else {
      return null;
    }
  };
  /*
   * Reset the internal .lastIndexes
   */
  ExpReg.prototype.reset = function(){
    /// reset and scan
    this.exp.single.lastIndex = 0;
    this.exp.multiple.lastIndex = 0;
  },
  /*
   * Find the next item as per the internal .lastIndex pointer
   */
  ExpReg.prototype.find = function(){
    /// remove previously found items
    /// but don't reset the internal pointer
    this.matches.length = 0;
    this.matched = false;
    if ( this.finished ) { return this; }
    //this.lastIndex = this.exp.multiple.lastIndex;
    /// whilst not global, match the first and stop
    var groups = this.exp.multiple.exec(this.source);
    if ( groups ) {
      this.matched = true;
      this.matches[this.matches.length] = {
        value: groups[0],
        groups: groups,
        offset: this.exp.multiple.lastIndex - groups[0].length,
        end: this.exp.multiple.lastIndex
      };
    }
    else {
      this.finished = true;;
    }
    return this;
  };
  
  ExpReg.prototype.finding = function(){
    this.find();
    return this.matched;
  }
  /*
   * Shortcut function -- which is actually the same length
   * as typing .find().replace()
   */
  ExpReg.prototype.findAndReplace = function(param, options){
    var result = this.find().replace(param, options);
    if ( this.finished && options.emptyFinish ) {
      return false;
    }
    else {
      return result;
    }
  };
  /*
   * Find all items in one fell swoop
   */
  ExpReg.prototype.findAll = function(){
    /// remove previously found items
    this.matches.length = 0;
    this.matched = false;
    /// reset and scan
    this.reset();
    var groups;
    /// if we are global we can findAll
    while( (groups=this.exp.multiple.exec(this.source)) ) {
      this.matches[this.matches.length] = {
        value: groups[0],
        groups: groups,
        offset: this.exp.multiple.lastIndex - groups[0].length,
        end: this.exp.multiple.lastIndex
      };
    }
    ///
    this.matched = true;
    return this;
  };
  /*
   * 
   */
  ExpReg.prototype.replace = function(param, options){
    var result, self = this, current, lastIndex, dif = 0;
    if ( this.finished ) { return this; }
    if ( !this.matched ) { this.find(); }
    if ( this.matched ) {
      match = this.matches[0];
      lastIndex = this.exp.multiple.lastIndex;
      result = this.source.replace(this.exp.multiple, function(m){
        var i = arguments[match.groups.length], r = undefined;
        if ( i === match.offset ) {
          if ( is.string(param) ) {
            r = param;
          }
          /// NOTE: this code will execute even if the array is empty
          /// it will just have no effect.
          else if ( is.array(param) ) {
            r = param.shift();
          }
          else if ( is.callable(param) ) {
            r = param.call(self, arguments, self);
          }
        }
        if ( r !== undefined ) {
          dif = r.length - m.length;
          return r;
        }
        else {
          return m;
        }
      });
      this.exp.multiple.lastIndex = lastIndex + dif;
    }
    if ( options && options.returnResult ) {
      return result;
    }
    else {
      this.source = result;
    }
    return this;
  };
  /*
   * Replace all matches with param: Which can be a string, array of strings, array
   * of functions, or just a function.
   */
  ExpReg.prototype.replaceAll = function(param, options){
    var result, self = this, index = 0;
    if ( !this.matched ) { this.findAll(); }
    if ( this.matches.length ) {
      /// here we handle simple strings
      if ( is.string(param) ) {
        result = this.source.replace(this.exp.multiple, param);
      }
      /// here we handls arrays
      else if ( is.array(param) ) {
        param = param.slice(); /// clone the array
        result = this.source.replace(this.exp.multiple, function(m){
          index = index % param.length;
          var v = param[index++];
          /// if the array item is callable, do so
          if ( is.callable(v) ) {
            return v.call(self, arguments, self);
          }
          /// otherwise cast to string
          else {
            return v;
          }
        });
      }
      /// here we handle callable items
      else if ( is.callable(param) ) {
        result = this.source.replace(this.exp.multiple, function(){return param.call(self, arguments, self);});
      }
    }
    if ( options && options.returnResult ) {
      return result;
    }
    else {
      this.source = result;
    }
    return this;
  };
  /*
   * Replace one match each time the returned replacement iterable is called.
   * With each call the replacement iterable will return the current state of
   * the string.
   *
   * Works in a similar way to calling .replace(), but has the added benefit
   * of wrapping that call with fixed arguments -- which can be bundled up
   * and sent to other code.
   *
   * You can supply a callback/value at the time the iterable is created, or 
   * you can pass a callback/value each time the iterable is called.
   *
   * You can only specify options when the iterable is created.
   *
   * To avoid the use of the iterable causing circular loops, the option
   * emptyFinish is always on.
   *
   * @TODO: tie this into the actual ES spec for iterables.
   */
  ExpReg.prototype.replaceIter = function(param, options){
    var self = this, iter;
    if ( !options ) { options = {}; }
    options.emptyFinish = true;
    iter = function(param2){
      if ( self.findAndReplace.apply(self, [arguments.length ? param2 : param, options]) ) {
        return self.source;
      }
      else {
        return false;
      }
    }
    iter.reset = function(){self.reset();}
    return iter;
  };
  /*
   * There is no nice UI way to replace a specific nth match with RegExp.
   * ExpReg makes it neater and clearer.
   */
  ExpReg.prototype.replaceNth = function(nth, param, options){
    var self = this, match, dif = 0;
    if ( nth < this.matches.length ) {
      match = this.matches[nth];
      result = this.source.replace(this.exp.multiple, function(m){
        /// @TODO: see if there is a better way of getting the i 
        /// offset when there are multiple capture groups
        var i = arguments[match.groups.length], r = undefined;
        if ( i === match.offset ) {
          if ( is.string(param) !== false ) {
            r = param;
          }
          /// NOTE: this code will execute even if the array is empty
          /// it will just have no effect.
          else if ( is.array(param) ) {
            r = param.shift();
          }
          else if ( is.callable(param) ) {
            r = param.apply(self, arguments);
          }
        }
        if ( r !== undefined ) {
          dif = r.length - m.length;
          match.value = r;
          match.end = match.offset + match.value.length;
          return r;
        }
        else {
          return m;
        }
      });
      if ( this.reversed ) {
        this.shiftMatches(0, nth, dif);
      }
      else {
        this.shiftMatches(nth, this.matches.length, dif);
      }
      this.source = result;
    }
  };
  ExpReg.prototype.shiftMatches = function(from, till, dif){
    /// update all matches that come after the one we've altered
    for ( var i=from; i<till; i++ ) {
      if ( this.matches[i] ) {
        this.matches[i].offset += dif;
        this.matches[i].end += dif;
      }
      /// @TODO: we need to update the group offsets too
    }
  };
  /*
   * Call a callback for each match found
   */
  ExpReg.prototype.each = function(callback){
    if ( !this.matched ) { this.findAll(); }
    if ( this.matches.length ) {
      var i, l = this.matches.length;
      for( i=0; i<l; i++ ) {
        callback.call(this, this.matches[i], i, this);
      }
    }
    return this;
  };
  /*
   * Map the matches to an array
   */
  ExpReg.prototype.map = function(callback){
    var a = [];
    if ( !this.matched ) { this.findAll(); }
    if ( this.matches.length ) {
      var i, l = this.matches.length;
      if( typeof callback == 'undefined' ) { callback = 1; }
      if ( callback.call ) { 
        for( i=0; i<l; i++ ) {
          a[i] = callback.call(this, this.matches[i], i, this);
        }
      }
      else {
        for( i=0; i<l; i++ ) {
          if ( this.matches[i] && typeof this.matches[i].groups[callback] != 'undefined' ){
            a[i] = this.matches[i].groups[callback];
          }
        }
      }
    }
    return a;
  };
  /*
   * wrap the matches with strings
   */
  ExpReg.prototype.wrap = function(pre, post){
    this.replace(function(matches){
      return pre+matches[0]+post;
    });
    return this;
  };
  ExpReg.prototype.reverse = function(){
    if ( !this.matched ) { this.findAll(); }
    this.matches.reverse();
    this.reversed = !this.reversed;
    return this;
  };
  /*
   * debug log
   */
  ExpReg.prototype.log = function(pre, post){
    this.each(function(match, i){
      console.log(i, match);
    });
    return this;
  };
  /*
   * Experimental feature, to allow for quick "matched" tests
   */
  ExpReg.prototype.valueOf = function(){
    return this.matched ? 1 : 0;
  };
  /*
   * Expose ExpReg as part of the string prototype.
   */
  String.prototype.ExpReg = ExpReg;
  return ExpReg;
});

/*
 * Scans down an object structure and links subobjects back up
 * to their parent with a reference trapped in a closure.
 * Keeping things in a closure avoids circular references
 * within the data structure itself -- which can cause issues
 * when logging, traversing or exporting. Keeping references
 * trapped in closures however can be a key area of memory leaks
 * if you don't tidy up after yourself however... this will
 * affect older JavaScript interpreters more than modern ones.
 *
 * This allows a subobject to be identified as a descendent
 * within the targeted structure.
 *
 *  E.g. var it = t.chain({must: {be: {christmas: {}}}});
 *       console.log(t.chain.hasAncestor(it.must.be.christmas, it)); // true
 */
t.chain = t.wrapper(function(wrapper){
  wrapper.parentClosure = function(parent){
    return function(){
      return parent;
    }
  };
  return t.method({
    attributes: {
      hasAncestor: function(target, ancestor){
        if ( target === ancestor ) return true;
        while ( target && target.parent ) {
          target = target.parent();
          if ( target === ancestor ) return true;
        };
        return false;
      }
    },
    method: function(obj, parent){
      if ( is.object(obj) ) {
        if ( parent ) { obj.parent = wrapper.parentClosure(parent); }
        for ( var key in obj ) {
          if ( !Object.prototype.hasOwnProperty || Object.prototype.hasOwnProperty.call(obj, key) ) {
            is.object(obj[key]) && t.chain(obj[key], obj);
          }
        }
      }
      return obj;
    }
  });
});

/*
 * Specify a new config for an overload -- @TODO: is this even used now???
 *
 */
theory.overload.config = function(){
  return Object.create(t.overload);
};

/**
 * From an array of arrays of strings, combine to form
 * all possible concatinated string outcomes.
 *
 *     ['a', ['b', 'c', 'd'], ['e', 'f']]
 *
 *  would produce:
 *
 *     abe, abf, ace, acf, ade, adf
 *
 * WHY?? You may well ask, and if you did ask it well then...
 * This handles creating the alternative combinations
 * for keys in t.overload().
 *
 * @memberof! theory.overload
 * @method
 */
theory.overload.allCombinations = function(bits, options){
  if ( !options ) { options = {}; }
  if ( !options.sep ) { options.sep = ''; }
  var newfixes, prefixes = [''];
  for ( var a=bits, i=0, l=a.length, item; i<l, item=bits[i]; i++ ) {
    newfixes = [];
    if ( !item.join ) { item = [item]; }
    for ( var ii=0, ll=item.length, bit; ii<ll, bit=item[ii]; ii++ ) {
      if ( bit.join ) continue; /// sub-sub arrays mean nothing!
      for ( var iii=0, lll=prefixes.length; iii<lll; iii++ ) {
        newfixes.push(prefixes[iii] ? prefixes[iii] + options.sep + bit : bit);
      }
    }
    prefixes = newfixes;
  }
  return newfixes || [];
};

/**
 * Split an overload key into its constituent parts
 *
 *  e.g. `'[string, object]'`           becomes `['string', 'object']`
 *
 *  e.g. `'[string, object] [object]?'` becomes `['string', 'object', 'object']`
 *
 * @memberof! theory.overload
 * @method
 */
theory.overload.parseKey = t.method({
  attributes: {
    keyPattern: /\[([^\]]+)\]/ig,
    itmPattern: /, */ig
  },
  method: function(key){
    var items = [], self = this.parseKey;
    key.replace(self.keyPattern, function(outer, inner){
      var bits = inner.split(self.itmPattern);
      for ( var i=0, l=bits.length; i<l; i++ ) {
        items.push(bits[i]);
      }
    });
    return items;
  }
});

/**
 * Combine any keys passed in, together.
 *
 *     extendKey('[array:list, callable:callback]', '[string:test]')
 *     // '[array:list, callable:callback, string:test]'
 *
 * @todo This code doesn't currently handle the keys being wrapped with []. it should.
 *
 * @memberof! theory.overload
 * @method
 */
theory.overload.extendKey = function(){
  return '[' + Array.prototype.slice.call(arguments, 0).join(', ') + ']';
};

/**
 * Used to call a described overload method, supports string references.
 *
 * @memberof! theory.overload
 * @method
 */
theory.overload.callItem = function(desc, item, context, args, hops){
  if ( !hops || !is.number(hops) || hops<1 ) { hops = 4; }
  if ( is.string(item) ) {
    /// loop the infinite reference of strings (limited to hops)
    do { item = desc[item]; } while ( item && is.string(item) && hops-- );
  }
  if ( item && is.callable(item) ) {
    return item.apply(context||this, args||[]);
  }
  throw new Error('Overload failed to call ' + item);
};

/**
 * Overload description processors allow the overload behaviour to 
 * be extended.
 * 
 * These should make changes to the description object before being 
 * handed to the item processors.
 *
 * You can add your own processor by .push()-ing a method to this
 * array. The method should have the following signature:
 *
 *     function(desc, internal) {}
 *
 *  - `desc` is the entire description object
 *  - `internal` is a provided storage object, per description but separate from description
 *
 * @memberof! theory.overload
 * @namespace
 */
theory.overload.descProcessors = new Array();

/**
 * Inline names allows for a more succint way of naming params.
 *
 * So rather than:
 *
 *     [array, callable, number] > [list, callback, delay]
 *
 * You can use:
 *
 *     [array:list, callable:callback, number:delay]
 *
 * It is personal preference which is prefered for readability.
 * However, inline names are less prone to typing mistakes.
 * Especially if you start using optional parameters, for
 * example:
 *
 *     [array][callable, number]? > [list][callback, delay]?
 *
 * Would be:
 *
 *      [array:list][callable:callback, number:delay]?
 *
 * @memberof! theory.overload.descProcessors
 * @method
 */
theory.overload.descProcessors.inlineNames = t.wrapper(function(wrapper){
  wrapper.translatePattern = t.ExpReg(/([^\[\]\:\|\s,]+)\:([^\[\]\:\|\s,]+)/);
  return function(desc){
    var key, bits, bit, i, l, opts = {returnResult: true}, a, b;
    for ( key in desc ) {
      if ( desc.hasOwnProperty(key) ) {
        if ( key.indexOf(':') != -1 ) {
          bits = wrapper.translatePattern.haystack(key).findAll();
          a = bits.replaceAll(function(matches){return matches[1];}, opts);
          b = bits.replaceAll(function(matches){return matches[2];}, opts);
          if ( a && b ) {
            desc[a+' > '+b] = desc[key];
            delete desc[key];
          }
        }
      }
    }
  };
});

/**
 * translateToArgsObject allows methods defined to receive
 * an args object with named attributes, instead of a list 
 * of params.
 *
 * For example:
 * 
 *     var test = t.overload({
 *       '[array, callable] > [list, callback]': function(args){
 *         console.log(args)
 *       };
 *     });
 *
 *     test([123], function(){});
 *
 * Would produce the following in the console:
 *
 *     { list: [123], callback: function(){} }
 *
 * I personally prefer the readability of the above to
 * that of the colon syntax with Inline Names. However, it
 * can get a bit verbose.
 *
 * @memberof! theory.overload.descProcessors
 * @method
 */
theory.overload.descProcessors.translateToArgsObject = t.wrapper(function(wrapper){
  wrapper.sepPattern = / *> */,
  wrapper.createReplacement = function(desc, names, original){
    return function(){
      for ( var args={}, a=arguments, i=0, l=a.length; i<l; i++ ) { args[names[i]] = a[i]; }
      return t.overload.callItem(desc, original, this, [args]);
    }
  };
  return function(desc){
    var key, bits;
    for ( key in desc ) {
      if ( desc.hasOwnProperty(key) ) {
        /// if we have a secondary part to the item key, use it as param naming
        bits = key.split(wrapper.sepPattern, 2);
        if ( bits[0] && bits[1] ) {
          /// create the new replacement
          desc[bits[0]] = wrapper.createReplacement(desc, t.overload.parseKey(bits[1]), desc[key]);
          /// remove the existing
          delete desc[key];
        }
      }
    }
  };
})

/**
 * Alternative Keys gives support for the following key notation:
 *
 *     [array, object|string]
 *
 * @memberof! theory.overload.descProcessors
 * @method
 */
theory.overload.descProcessors.alternativeKeys = function(desc){
  var key, bits, bit, i, l;
  for ( key in desc ) {
    if ( desc.hasOwnProperty(key) ) {
      /// if there are choice parameters, create a look up for every combination
      if ( key.indexOf('|') != -1 ) {
        /// step the overload key with choice combinations, convert to array of arrays
        bits = key.substring(1, key.length - 1).split(', ');
        for ( i=0, l=bits.length; i<l, bit=bits[i]; i++ ) {
          if ( bit && bit.indexOf('|') != -1 ) {
            bits[i] = bit.split('|');
          }
        }
        /// create references on the descriptor, for each alternative combination key
        bits = t.overload.allCombinations(bits, {sep: ', '});
        for ( i=0, l=bits.length; i<l, bit=bits[i]; i++ ) {
          if ( bit ) {
            desc['[' + bit + ']'] = key;
          }
        }
      }
    }
  }
};

/**
 * Optional Arguments gives support for the following key notation:
 *
 *     [array, object] [string]?
 *
 * @memberof! theory.overload.descProcessors
 * @method
 */
theory.overload.descProcessors.optionalArguments = t.wrapper(function(wrapper){
  wrapper.translatePattern = t.ExpReg(/\s*\[([^\]]+)\]\s*\??\s*/);
  return function(desc){
    var key, basekey;
    for ( key in desc ) {
      if ( desc.hasOwnProperty(key) ) {
        if ( key.indexOf(']?') != -1 ) {
          basekey = '';
          wrapper.translatePattern
            .haystack(key)
            .findAll()
            .each(function(match, i, exr){
              var newkey = t.overload.extendKey.apply(t.overload, this.map(1));
              if ( !basekey ) {
                basekey = newkey;
                desc[newkey] = desc[key];
                delete desc[key];
              }
              else {
                desc[newkey] = basekey;
              }
              exr.matches.length--;
            })
          ;
        }
      }
    }
  };
});

/// add these to the processor list
(function(list, processors){
  list.push(processors.inlineNames);
  list.push(processors.translateToArgsObject);
  list.push(processors.optionalArguments);
  list.push(processors.alternativeKeys); /// <-- this needs to occur last as it doesn't play well before others.
})(t.overload.descProcessors, t.overload.descProcessors);

/*
 * Overload item processors allow the overload behaviour to be extended.
 * Item processors are applied after description processors, and should
 * concern themselves with modifying the item in question. Any modifications
 * to the description object itself i.e. adding more items, may cause 
 * unexpected side-effects.
 *
 * You can add your own processor by .push()-ing a method to this
 * array. The method should have the following signature:
 *
 *  function(key, desc, internal)
 *
 *  - `key` is the description item's key
 *  - `desc` is the entire description object
 *  - `internal` is a provided storage object, per description item
 */
t.overload.itemProcessors = new Array();

/*
 * Keep track of some internal systems that are exposed externally
 * using different means.
 */
t.internal = {};

/*
 * Theory's Array handling
 */
t.internal.array = {
  
  i: {
    items: null
  },
  
  create: function(){
    return this.prep.apply(Object.create(this), arguments);
  },

  prep: function(source){
    //this.proto = Object.getPrototypeOf(this);
    this.i = Object.create(this.i);
    this.i.items = Array.prototype.slice.call(source, 0);
    t.define(this, 'length', {
      get: function(){
        return this.i.items.length;
      }
    });
    t.borrow('push', 'pop', 'join', 'shift', 'unshift')
      .preserveContext()
      .from(this.i.items)
      .giveTo(this)
    ;
    return this;
  },
  
  /**
   * @memberof! theory.array
   * @method
   */
  source: function(){
    return this.i.items;
  },
  
  /**
   * @memberof! theory.array
   * @method
   */
  each: function(callback, context){
    var target = this.source();
    !context && (context=this);
    if ( !is.callable(callback) ) {
      return t.error(new Error('t.array().each callback must be is.callable().'));
    }
    for ( var i=0, a=target, l=a.length; i<l; i++ ) {
      callback.call(context, a[i], i);
    }
  },
  
  /**
   * @memberof! theory.array
   * @method
   */
  keys: function(target){
    if ( Object.keys ) {
      return t.array(Object.keys(target||this.source()));
    }
    else {
      /// @TODO: Array.keys fallback for older browsers
    }
  },
  
  map: function(callback, context, args){
    /// @TODO: Implement t.array.map
  },
  
  sum: function(){
    /// @TODO: Implement t.array.sum
  },
  
  getLast: function(){
    return this.i.items[this.i.items.length-1];
  },
  
  setLast: function(v){
    this.i.items[this.i.items.length-1] = v;
    return this;
  },
  
  getJoined: function(sep){
    return this.i.items.join(sep);
  },
  
  /*
  length: t.method({
    attributes: {
      valueOf: function(){
        return this();
      }
    },
    method: function(){
      return this.i.items.length;
    }
  }),
  */
  
  toString: function(){
    return String(this.source());
  }

};

/*
 * Theory's object handling
 */
t.internal.object = {
  
  i: {
    target: null
  },
  
  selectors: {},
  
  create: function(){
    return this.prep.apply(Object.create(this), arguments);
  },

  prep: function(source){
    var proto = Object.getPrototypeOf(this);
    this.i.source = source;
    this.each = t.bindCollection(proto.each, this, this.each.clone(this));
    return this;
  },
  
  /**
   * @memberof! theory.object
   * @method
   */
  source: function(){
    return this.i.source;
  },
  
  /**
   * @memberof! theory.object
   * @method
   */
  keys: function(target){
    if ( Object.keys ) {
      return t.array(Object.keys(target||this.source()));
    }
    else {
      /// @TODO: Object.keys fallback for older browsers
    }
  },

  /**
   * Handles usual expected `.each()` behaviour for objects, but also
   * contains a number of more specific each-like methods.
   *
   * @memberof! theory.object
   * @namespace
   */
  each: t.method({
    /**
     * @memberof! theory.object.each
     * @method ___callable
     */
    method: function(callback, context){
      return this.each.keyValues.apply(this, arguments);
    },
    attributes: {
      /**
       * @memberof! theory.object.each
       * @method
       * @private
       */
      _args: function(args){
        !args.le && (args[1]=this);
        if ( !is.callable(args[0]) ) {
          return t.error(new Error('t.array().each callback must be is.callable().'));
        }
      },
      /**
       * @memberof! theory.object.each
       * @method
       */
      key: function(callback, context){
        var key, target = this.source(); this.each._args(arguments);
        for ( key in target ) {
          if ( !Object.prototype.hasOwnProperty || Object.prototype.hasOwnProperty.call(target, key) ) {
            callback.call(context, key);
          }
        }
      },
      /**
       * @memberof! theory.object.each
       * @method
       */
      value: function(callback, context){
        var key, target = this.source(); this.each._args(arguments);
        for ( key in target ) {
          if ( !Object.prototype.hasOwnProperty || Object.prototype.hasOwnProperty.call(target, key) ) {
            callback.call(context, target[key]);
          }
        }
      },
      /**
       * @memberof! theory.object.each
       * @method
       */
      keyValue: function(callback, context){
        var key, target = this.source(); this.each._args(arguments);
        for ( key in target ) {
          if ( !Object.prototype.hasOwnProperty || Object.prototype.hasOwnProperty.call(target, key) ) {
            callback.call(context, key, target[key]);
          }
        }
      },
      /**
       * @memberof! theory.object.each
       * @method
       * @todo requires completion, should step each sub object.
       */
      object: function(callback, context){
        /// @TODO: Support for t.each.objects
      },
      /**
       * @memberof! theory.object.each
       * @method
       * @todo requires completion, should step each callable sub item.
       */
      callable: function(callback, context){
        /// @TODO: Support for t.each.callables
      },
      /**
       * @memberof! theory.object.each
       * @method
       * @todo requires completion, should step each non-object sub item.
       */
      attribute: function(callback, context){
        /// @TODO: Support for t.each.attributes
      }
    }
  })
  
};

/*
 * Early array and object wrappers, these get rewritten for better
 * support later on. Once t.creator is set-up.
 */
t.array = function(){ var o = t.internal.array;  return o.create.apply(o, arguments); };
t.object = function(){ var o = t.internal.object; return o.create.apply(o, arguments); };

/**
 * Allows for the creation of an object "constructor".
 *
 * Theory doesn't use conventional constructors (i.e. a function with a prototype)
 * instead, it makes use of the `Object.create` methodology.
 *
 * You provide an object that is used as the base prototype, all instances are
 * derived from this object, along with some specific "Theory<sup>&trade;</sup>" enhancements.
 *
 * Theory also doesn't implement any class-like inheritance, perfering to opt for
 * the mixin / borrow approach. This comes from the perspective that the real creative power 
 * behind JavaScript is to share objects and methods. To be flexible, sketchable and extensible
 * as much as possible. Whilst this may fly in the face of specific runtime optimisations -- 
 * those that can be gained through using prototyped constructors and hidden classes -- I have 
 * yet to come across a situation where I have needed that kind of speed.
 *
 * Put simply, if you are a developer who needs those kinds of crucial optimisations, building 
 * massively complex and intensive systems, you are unlikely to be using Theory.
 *
 * ###### Creator rules
 *
 * Beyond passing in an object with whatever methods attached of your choosing,
 * `t.creator` listens out for some specific keys that either it expects to have,
 * or that modify its behaviour. These are:
 *
 * - **prep** -- if no method supplied, a default is added.
 * - **create** -- if no method supplied, a default is added.
 * - **theory** -- if this subobject exists, traverse and apply what it describes to the constructor.
 *
 * ###### Create method
 *
 * In most cases you won't need to specify your own create method, but you can do so
 * if you like. The basis of such a method is as follows:
 *
 *     create: function(){
 *       return this.prep.apply(Object.create(this), arguments);
 *     }
 *
 * The default create method that is supplied for all creators however, looks like this:
 *
 *     create: function(){
 *       var creator = this;
 *       var o = creator.prep.apply(Object.create(creator), arguments);
 *           o.constructor = creator;
 *           o.mixTo = t.creator.mixToInstance;
 *           o.mixOwnTo = t.creator.mixOwnToInstance;
 *           o.creator = function(){ return creator; };
 *           o.isNamespacedOf = null;
 *           o.getNamespacedSource = null;
 *       return o;
 *     }
 *
 * > NOTE: Theory.js already polyfills `Object.create`, so you do not need to worry
 *   if the browser supports it or not.
 *
 * ###### Prep method
 *
 * Each creator requires a method that is executed whenever a new instance is
 * created, this is named `prep` and is called directly after `create` is called.
 *
 * Whereas `create` is nearly always the same for every creator, `prep` only needs
 * to follow one rule. It must return `this`. Other than that, it can be defined
 * as you like.
 *
 * > NOTE: In most of the Theory code prep is used to set-up the internal object
 *   a.k.a. `i`. This is so that each instance has its own unique reference that
 *   it can store "private" data within.
 *
 * for example:
 *
 *     t.creator({
 *       i: null,
 *       prep: function(){
 *         this.i = {}; // <-- set up a new object with each instance.
 *       },
 *       sharedMethod: function(){
 *         // Whilst we are creating a new `this.i` each istance, this method will be shared.
 *       }
 *     });
 *
 * ###### Theory subobject
 *
 * You can define a subobject within your creator's description under the key of
 * `theory` which will add more abilities to your creator. Expected keys are currently:
 *
 * - **prep** -- This method will be executed just after the creator has been
 *   created. It is passed the creator's description (after any automatic 
 *   additions) and is responsible for returning it (or a replacement). This
 *   method can be used to apply changes to the description that rely on
 *   referencing the description itself.
 *
 * - **mix** -- This array is used to list the items that should be mixed in to
 *   the creator .
 *
 * for example:
 *   
 *     t.creator({
 *       theory: {
 *         /// implement a simplistic version of `theory.creator.callable`
 *         prep: function(desc){
 *           var callable = function(){ return desc.create.apply(desc, arguments); };
 *           t.extend(callable, desc);
 *           return callable;
 *         },
 *         /// mixin all usable methods from t.events (not fully functional yet,
 *         /// I am currently working out exactly how this should behave with
 *         /// regard to the difference between static and instance methods.)
 *         mix: [ t.events ]
 *       }
 *     });
 *
 * > NOTE: Future versions of Theory may rename the `prep` here to something else,
 *   to avoid confusion with the decription prep method.
 *
 * ###### Static quirk
 *
 * One oddity with the way Theory creators are constructed is that every property and
 * method will exist for each instance of a creator (as expected), but they will also 
 * exist statically on the creator object itself.
 *
 *     var a = t.creator({
 *       myVeryEasyMethod: function(){
 *         return 'justSetUpNinePlanets';
 *       }
 *     });
 *
 *     var b = a.create();
 *
 *     console.log( a.myVeryEasyMethod() ); // justSetUpNinePlanets
 *     console.log( b.myVeryEasyMethod() ); // justSetUpNinePlanets
 *
 * The Theory codebase takes advantage of this quirk in many places, and has specifically
 * coded methods to handle each way the method might be called. But it should be noted
 * this is not typically the case (or expected) for many frameworks or languages. Especially
 * to those coming from a strict class-based environment.
 *
 * Whilst many may not like this approach, it ties in well with Theory's open and 
 * shared ethos, allowing access to methods where you might expect them -- rather
 * than having to shift down the prototype chain.
 *
 * The main thing to take away from this quirk?
 *
 * > You should always know where your `this` is...
 *
 * But then again, you're a JavaScript developer, so that should be second nature. ;)
 *
 * @memberof! theory
 * @namespace
 *
 * @todo automatically mixing in object with `mix:` is not yet defined.
 */
theory.creator = t.method({
  
  /**
   * Whilst `theory.creator` is a namespace -- to house all things "creator" -- 
   * it is also a function in itself. It should be called directly to create
   * new creators.
   *
   * @memberof! theory.creator
   * @method ___callable
   * @param {object} desc The description object that describes the creator.
   *
   * @example
   *
   * var a = t.creator({
   * 
   *   // It is recommended that creators have their own internal object.
   *   // This is because every instance of a creator chains back to
   *   // the description object via its prototype chain. This means that
   *   // the new instance will be sharing every referencable property 
   *   // and method with all the other instances. Whilst you could
   *   // define "internal" properties directly on your instance, it
   *   // is a far better coding style to use objects as namespaces.
   *   // Mainly because it becomes much easier to manage grouped properties.
   *   // You may opt to use something other than `i`, but that is a standard
   *   // within the theory codebase itself.
   *   i: null,
   *
   *   // just the same as .i, it can be useful to have a namespaced .shared
   *   // object. Used for containing properties that are shared between
   *   // instances. Again this is personal preference, but the Theory 
   *   // codebase tends to keep the base object of a creator containing
   *   // just shared methods, and a subobject called "shared", containing 
   *   // shared properties.
   *   shared: {},
   * 
   *   // .create is automatically added, so you don't need this.
   *   // create: function(){...}
   * 
   *   // Every creator should have a `prep` method, one will be automatically
   *   // added if not provided. This function is responsible for setting up
   *   // new instances.
   *   prep: function(param){
   *     this.i = {};
   *     this.i.param = param;
   *     return this;
   *   },
   * 
   *   // As with every method and referencable property, this method will exist
   *   // statically on the creator and on every created instance using `.create()`
   *   aSimpleMethod: function(){},
   *
   *   // Create a t.overload method that handles both object and string arguments
   *   anOverloadedMethod: {
   *     overloads: {
   *       '[object]': function(obj){ return 'you object!'; },
   *       '[string]': function(str){ return 'you string!'; }
   *     }
   *   },
   *
   *   // Create a t.method with additional attributes
   *   aTheoryMethod: {
   *     attributes: {
   *       exposedOnMethod: function(){ return 'hello'; }
   *     }
   *     method: function(){ return 'world'; }
   *   },
   *
   *   // An alternative overload syntax
   *   aDifferentWayToOverload: {
   *     method: {
   *      defaults: [[], 0],
   *      arguments: '[array, number]',
   *      method: function(args){}
   *     }
   *   }
   * 
   * });
   * 
   * var b = a.create(123);                        // <-- creates a new instance of a.
   * 
   * console.log(b.i.param);                       // 123
   * console.log(b.aTheoryMethod.exposedMethod()); // hello
   * console.log(b.aTheoryMethod());               // world
   * console.log(b.anOverloadedMethod({}));        // you object!
   * console.log(b.anOverloadedMethod(''));        // you string!
   */
  
  attributes: {
    /**
     * Create a creator that can be called as a function rather than 
     * having to use `.create()`.
     *
     * Unfortunately, avoiding experimental JS advances means that
     * the best way to achieve a callable object, is to mix the 
     * object properties across to that of a function. This means
     * you don't retain the original object reference, and have
     * to modify the behaviour of `isPrototypeOf` -- but it is better
     * than nothing.
     *
     * The implementation may be rather simplistic, but it does 
     * avoid depending on the likes of `__proto__` . New facilities 
     * that can't be relied upon 100%.
     *
     * @example
     * var a = t.creator.callable({
     *
     *   // it is recommended that creators have their own internal object (see above)
     *   i: {},
     *
     *   // every creator should have a `prep` method (see above)
     *   prep: function(param){
     *     this.i = {};
     *     this.i.param = param;
     *     return this;
     *   },
     *
     *   aRandomMethod: function(){
     *     // this method will exist both statically
     *     // and on every created instance using `.create()`
     *   }
     *
     * });
     *
     * var b = a(123);         // <-- calls .create() in the background
     *     b = a.create(123);  // <-- creates a new instance of a.
     *
     * console.log(a.i.param); // undefined
     * console.log(b.i.param); // 123
     *
     * @memberof! theory.creator
     * @method
     * @param {object} desc The description object that describes the creator.
     */
    callable: function(desc){
      var obj = this(desc);
          obj = t.extend(function(){ return desc.create.apply(desc, arguments); }, desc);
          obj.isPrototypeOf = function(test){
            if ( test && test.isNamespacedOf ) {
              return test.isNamespacedOf(obj);
            }
            else {
              return desc.isPrototypeOf(test);
            }
          };
          obj.getDescription = t.creator.i.getDescription.bind(obj);
      return obj;
    },
    
    /**
     * A wrapper of internal functions used by {@linkcode theory.creator} 
     *  -- they should not be called statically -- unless you know what you
     * are doing, of course.
     * 
     * @memberof! theory.creator
     * @namespace
     */
    i: {
      /**
       * Creators can call a number of other Theory functionalities into play
       * just by defining subobject in particular ways. This function is what
       * reacts to those subobjects. Currently supported are:
       *
       * - **wrappers** -- See {@linkcode theory.wrapper}
       * - **methods** -- See {@linkcode theory.method}
       * - **overloads** -- See {@linkcode theory.overload}
       *
       * @memberof! theory.creator.i
       * @method
       * @param {object} obj
       * @see theory.object#each
       */
      processItems: function(obj){
        t.object(obj).each.keyValue(function(key, item){
          if ( !item || is.callable(item) ) return;
          if ( item.wrapper ) {
            obj[key] = t.wrapper(item.method, item.wrapper, obj);
          }
          else if ( item.overloads ) {
            obj[key] = t.overload(item.overloads);
          }
          else if ( item.method ) {
            if ( is.callable(item.method) ) {
              obj[key] = t.method(item);
            }
            else {
              obj[key] = t.overload(item);
            }
          }
        });
      },
      /**
       * Each creator has the ability to mix its content into another 
       * object. By default the context is preserved to be that of 
       * the object being borrowed from -- however this can be changed by 
       * passing:
       *
       *     .mixTo(..., {preserveContext: false});
       *
       * By default this will mix every method, unless filterd out, or the 
       * current context provides a `getMixToList()` method that returns 
       * an array of keys to mix.
       *
       * @memberof! theory.creator
       * @instance
       * @param {*} dest
       * @param {object} [options]
       * @param {object} [options.preserveContext = true]
       */
      mixTo: function(dest, options){
        var b;
        if ( !options ) { options = {}; }
        if ( options.preserveContext === t.undefined ) { options.preserveContext = true; }
        if ( this.getMixToList ) { options.filter = this.getMixToList(); }
        if ( options.filter ) { b = t.borrow(options.filter); }
        else if ( options.ownProperties ) { b = t.borrow().allOwn(); }
        else { b = t.borrow().all(); }
        if ( options.preserveContext ) { b = b.preserveContext(); }
        b.from(this).giveTo(dest);
        return this;
      },
      /**
       * The same as {@linkcode theory.creator#mixTo t.creator().mixTo()} save for being filtered by `hasOwnProperties`.
       *
       * @example
       *
       * var a = t.creator({
       *   methodToMix: function(){
       *     return this;
       *   }
       * });
       *
       * var b = {};
       *
       * a.mixTo(b);
       *
       * console.log( b.methodToMix() === a ); // true
       *
       * @memberof! theory.creator
       * @instance
       * @param {*} dest
       * @param {object} [options]
       * @param {object} [options.preserveContext = true]
       */
      mixOwnTo: function(dest, options){
        if ( !options ) { options = {}; }
        if ( !options.ownProperties ) { options.ownProperties = true }
        return this.mixTo(dest, options);
      },
      /*
       * .mixToInstance() is used when calling .mixTo() on an instance, rather than a creator.
       *
       * @memberof! theory.creator
       * @instance
       */
      mixToInstance: function(dest){
        return t.creator.i.mixTo.call(this, dest, { preserveContext: true });
      },
      /*
       * .mixOwnToInstance() is used when calling .mixOwnTo() on an instance, rather than a creator.
       *
       * @memberof! theory.creator
       * @instance
       */
      mixOwnToInstance: function(dest){
        return t.creator.i.mixOwnTo.call(this, dest, { preserveContext: true });
      },
      /*
       * The default .getMixToList()
       *
       * @memberof! theory.creator
       * @instance
       */
      getMixToList: function(){
        return Object.keys(this);
      },
      /*
       * General create function that is added to all creators.
       *
       * @memberof! theory.creator
       * @instance
       */
      create: function(){
        var creator = this;
        var o = creator.prep.apply(Object.create(creator), arguments);
            o.constructor = creator;
            o.mixTo = t.creator.i.mixToInstance;
            o.mixOwnTo = t.creator.i.mixOwnToInstance;
            o.creator = function(){ return creator; };
            o.isNamespacedOf = null;
            o.getNamespacedSource = null;
        return o;
      },
      /*
       * General prep function that is added to all creators.
       *
       * @memberof! theory.creator
       * @instance
       */
      prep: function(){
        this.i && (this.i = Object.create(this.i));
        return this;
      },
      /*
       * In order for the callable creators to behave as expected, we should
       * replace the isPrototypeOf method; so that the tests makes sense.
       *
       * @memberof! theory.creator
       * @instance
       */
      isPrototypeOfOverride: function(test){
        return this.getDescription().isPrototypeOf(test);
      },
      /*
       * Returns the origin that was namespaced, this function is always bound
       * so that this is the origin.
       *
       * @memberof! theory.creator
       * @instance
       */
      getNamespacedSource: function(){
        return this;
      },
      /*
       *
       *
       * @memberof! theory.creator
       * @instance
       */
      getDescription: function(){
        return this;
      },
      /*
       *
       *
       * @memberof! theory.creator
       * @instance
       */
      isNamespacedOf: function(test){
        var head = this, next;
        while ( head.getNamespacedSource ) {
          next = head.getNamespacedSource();
          if ( test === next ) {
            return true;
          }
          if ( next === head ) {
            break;
          }
          head = next;
        }
        return false;
      },
      /**
       * namespace allows a new version of the creator to exist (that inherits
       * from the original) but allows configurational changes to be made under
       * a particular named-space.
       *
       * ###### Why namespace a creator?
       *
       * Theory's ethos is that any piece of code should be able to take another
       * piece of code and configure it to run within its own parameters, even
       * if another piece of code is doing exactly the same thing elsewhere in 
       * the same environment.
       *
       * Namespacing allows you to do this.
       *
       * @memberof! theory.creator
       * @instance
       * @param {string} [name] If a name is specified the namespace is cached 
       *        and the same namespace will be returned each time that name is used.
       */
      namespace: function(name){
        var desc = this.getDescription(), nso;
        if ( desc.namespaces && desc.namespaces[name] ) {
          return desc.namespaces[name];
        }
        nso = is.callable(desc)
          ? Function.create(desc)
          : Object.create(desc)
        ;
        /// override the isProtoOf to test against desc rather than nso.
        //nso.isPrototypeOf = t.creator.isPrototypeOfOverride;
        /// new namespaces have theor own base internal object.
        nso.i = t.extend({}, nso.i);
        /// new namespaces have their own shared object.
        nso.shared = t.extend({}, nso.shared);
        /// identify objects that have been namespaced
        //nso.isNamespacedOf = t.creator.isNamespacedOf.bind(nso);
        //nso.getNamespaceSource = t.creator.getNamespacedSource.bind(desc);
        nso.getNamespacedSource = t.creator.i.getNamespacedSource.bind(this);
        nso.isNamespacedOf = t.creator.i.isNamespacedOf.bind(nso);
        nso.getDescription = t.creator.i.getDescription.bind(nso);
        ///
        //nso.description(nso);
        //nso.getNamespaceOrigin = 
        /// if a name has been specified we record the namespaced obj
        if ( name ) {
          nso.ns = name;
          !desc.namespaces && (desc.namespaces = {});
          desc.namespaces[ns] = nso;
        }
        return nso;
      }
    }
  },
  /*
   * The core .constructor() method. This underpins a lot of code
   * in the theory library.
   */
  method: function(obj){
    var res;
    /// used to store static attributes that are shared between instances
    !obj.shared       && (obj.shared = {});
    /// used to store internal information on a per instance basis
    !obj.i            && (obj.i = {});
    /// no one should really need to create their own create method
    !obj.create       && (obj.create = t.creator.i.create);
    /// prep on the other hand should be overridden.
    !obj.prep         && (obj.prep = t.creator.i.prep);
    /// allow namespacing
    !obj.namespace    && (obj.namespace = t.creator.i.namespace);
    /// All constructors can be mixed to another object
    !obj.mixTo        && (obj.mixTo = t.creator.i.mixTo);
    !obj.mixOwnTo     && (obj.mixOwnTo = t.creator.i.mixOwnTo);
    !obj.getMixToList && (obj.getMixToList = t.creator.i.getMixToList);
    //function(v){ if ( v ) { obj = v; } else { return obj; } };
    obj.isPrototypeOf = function(test){
      if ( test && test.isNamespacedOf ) {
        return test.isNamespacedOf(obj);
      }
      else {
        return Object.prototype.isPrototypeOf.call(this, test);
      }
    };
    /// process each keyed item
    t.creator.i.processItems(obj);
    /// All obj.theory methods will receive the constructor definition as 'this'.
    if ( obj.theory ) {
      /// prep is triggered once, after the constructor definition is whole.
      /// use this to manage method contexts and other global changes that
      /// will be required for every instance; but after the constructor has
      /// been processed by theory.constructor.
      if ( is.callable(obj.theory.prep) ) {
        res = obj.theory.prep.call(obj, obj);
        if ( res ) {
          obj = res;
        }
      }
    }
    /// expose or set the description object
    obj.getDescription = t.creator.i.getDescription.bind(obj);
    return obj;
  }
});

/**
 * Theory's base array handling
 * 
 * @namespace
 */
theory.array = t.creator.callable(t.internal.array);

/**
 * Theory;s base object handling
 *
 * @namespace
 */
theory.object = t.creator.callable(t.internal.object);

/*
 * The theory object gets recreated here, built up from early
 * theory code that needed to be in place before the more
 * complex items could be created.
 */
theory = (function(t){
  /// aliases
  t.i = t.internal;
  t.ns = t.namespace;
  return t;
})({
  
  /*
   * Import early stuff
   */
  is: is,
  has: has,
  global: t.global,
  undefined: t.undefined,
  ExpReg: t.ExpReg,
  error: t.error,
  overload: t.overload,
  wrapper: t.wrapper,
  method: t.method,
  define: t.define,
  chain: t.chain,
  log: t.log,
  extend: t.extend,
  clone: t.clone,
  borrow: t.borrow,
  bind: t.bind,
  bindCollection: t.bindCollection,
  bindCollectionRecursive: t.bindCollectionRecursive,
  unbind: t.unbind,
  step: t.step,
  promotePrimitive: t.promotePrimitive,
  
  internal: t.internal,
  
  array: t.array,
  object: t.object,
  creator: t.creator,
  
  /// @TODO: These are still work in progress
  dom:    typeof kipple != 'undefined' ? function(){ return kipple.resolve.apply(kipple, arguments); } : null,
  ui:     function(){},
  jsui:   function(){},
  
  wrap: function(v){
    switch ( true ) {
      case is.string(v):    return t.string(v); break;
      case is.arraylike(v): return t.array(v);  break;
      case is.object(v):    return t.object(v); break;
    }
    return v;
  },
  
  attr: function(elm, attr){
    var v = null;
    if ( !is.void(elm) ) {
      if ( elm.getAttribute ) {
        v = elm.getAttribute(attr);
      }
      else if ( is.defined(elm[attr]) ) {
        v = elm[attr];
      }
    }
    return v;
  },
  
  /*
   * Instance specific items @TODO: need to look into moving .array .object from .internal
   * and give them their own wrapper so we can use internal correctly.
   */
  userdata: {},
  
  /*
   * Create an instance of theory, this is used for namespacing configurational changes.
   */
  create: function(){
    return this.prep.apply(Object.create(this), arguments);
  },
  
  /*
   *
   */
  returnInstance: function(){
    return this.create();
  },
  
  /*
   *
   */
  prep: function(){
    this.userdata = Object.create(this.userdata);
    this.api.get = t.bind(this.api.get, this);
    return this;
  },
  
  /*
   * Define configuration options including namespace and api version
   */
  config: t.overload({
    '[object]':                 function(options)            { return this.confg(null, null, options); },
    '[string, object]':         function(namespace, options) { return this.confg(namespace, null, options); },
    '[string, number, object]': function(namespace, apiVersion, options){
      console.log(arguments);
      return this;
    }
  }),
  
  /*
   *
   */
  set: function(name, value){
    this.userdata[name] = value;
    return this;
  },
  
  /*
   *
   */
  namespace: function(name){
    return this.returnInstance().set('namespace', name);
  },
  
  /*
   * @TODO:
   */
  api: t.method({
    attributes: {
      get: function(v){
        return this.returnInstance();
      }
    },
    method: function(v){
      return this.api.get(v);
    }
  }),
  
  /*
   * A Prepare request @TODO:
   */
  fetch: function(){
    var d = t.deferred(), list = arguments;
    t.array(list).each(function(v, i){
      t.fetchHandler(v)
    });
    return d;
  },
  
  /*
   * Request particular add-ons @TODO:
   */
  using: t.overload({
    '[array, function]' : function(reqs, callback){
      return this;
    },
    '[..., function]' : function(reqs, callback){
      //var args = t.array(arguments),
      //    reqs = args.slice(0, -1),
      //    callback = args.slice(-1);
      //return this.using(reqs, callback);
      return this;
    }
  }),
  
  /*
   * Manipulations regarding "paths" through an object structure
   * basically an array of hierachy-descending keys.
   */
  path: {
  
    /*
     * Given an attribute/key path in the form of an array, this will navigate down an object.
     *
     *   E.g. t.path.navigate({one:{two:{three:123}}}, ['one', 'two', 'three']); // will return 123
     */
    navigate: function(obj, path){
      var head = obj;
      for ( var key=0, l=path.length; (key<l) && head; key++ ) {
        head = head[path[key]];
      }
      return head;
    },
    
    /*
     * Given an attribute/key path in the form of an array, delete the item found
     *
     *   E.g. t.path.remove({one:{two:{three:123}}}, ['one', 'two']); // will leave {one:{}}
     */
    remove: function(obj, path){
      var head = obj;
      for ( var key=0, l=path.length-1; (key<l) && head; key++ ) {
        head = head[path[key]];
      }
      if ( head && head[path[l]] ) {
        delete head[path[l]];
      }
      return head;
    }
    
  },
  
  /*
   * Given an object and a callback, the callback will be fired for each key/value that
   * the walk operation can reach.
   *
   * Because this function has so many abilities I'll list them here:
   *
   * - Walk will call your callback in hierarchy order
   *   - the walk callback will receive [value, key, level, path, userdata] as arguments
   *   - when proxying walk callback will receive [value, proxyValue, key, level, path, userdata]
   *   - if your callback returns false, walking will halt, and the overall operation returns false
   *   - if your callback returns a function, it will be called after all sub-elements (below the
   *     current level) have been processed. This has the affect of triggering in reverse-hierarchy order.
   *
   * - You can control to what depth the walk operation occurs by passing the deep param:
   *   - deep as a number will recurse that many levels in.
   *   - deep as boolean true will recurse as deep as possible.
   *   - deep as a function will be treated as a callback to test if we can travel deeper.
   *   - deep callback will receive [value, key, level, path, userdata] as arguments
   *   - when proxying deep callback will receive [value, proxyValue, key, level, path, userdata]
   *
   * - If you pass a proxy object, this object will be stepped along with the same structure as obj.
   *   - All calls to callbacks will receive the found proxy subelement for the current point (or undefined)
   *
   * - All callbacks receive a path parameter, which is an array of all the keys up to the current point.
   * - All callbacks will receive the same userdata param, if you pass it in.
   *
   * WARNING: There is no protection against recursive loops.
   */
  walk: function(obj, callback, deep, proxy, userdata, level, path, key, proxing){
    var resultcb, result, deeper, l;
    if ( !level ) { level = 0; proxing = !!proxy; path = []; }
    if ( level && callback ) {
      resultcb = proxing
        ? callback.call(obj, obj, proxy, key, level, path, userdata)
        : callback.call(obj, obj, key, level, path, userdata)
      ;
      if ( resultcb === false ) { return false; }
    }
    if ( deep && deep.call ) {
      deeper = proxing
        ? deep.call(obj, obj, proxy, key, level, path, userdata)
        : deep.call(obj, obj, key, level, path, userdata)
      ;
    }
    else {
      deeper = deep === true || deep < level;
    }
    if ( !level || deeper ) {
      switch ( true ) {
        case is.array(obj):
          for ( key=0, l=obj.length; key<l; key++ ) {
            result = t.walk(obj[key], callback, deep, proxy && proxy[key], userdata, level+1, path.concat([key]), key, proxing);
            if ( result === false ) { return false; }
          }
        break;
        case is.object(obj):
          for ( key in obj ) {
            if ( !Object.prototype.hasOwnProperty || Object.prototype.hasOwnProperty.call(obj, key) ) {
              result = t.walk(obj[key], callback, deep, proxy && proxy[key], userdata, level+1, path.concat([key]), key, proxing);
              if ( result === false ) { return false; }
            }
          }
        break;
      }
    }
    if ( resultcb && is.callable(resultcb) ) {
      resultcb.call();
    }
  },
  
  /*
   * Very simple compare method
   */
  compare: t.method({
    /// These attributes will be "statically" attached to the 
    /// t.compare method
    attributes: {
      MODES: t.chain({
        /// compare only the attributes found in "a" to 
        /// those in "b", extra attributes in "b" are ignored
        partial: {},
        /// compare "a" to "b" completely, meaning if "b" has 
        /// extra attributes the compare will fail
        complete: {
          by: {
            /// complete.by.remainder means that a clone
            /// of the "b" object is created, and as "a"
            /// is parsed the traversed attributes are deleted
            /// from "clone b". If there are any remaining 
            /// structures in the "clone b" at the end the
            /// compare fails.
            remainder: {}
          }
        },
        ///
      }),
      process: function(obj, other, key, level, path, options){
        /// if we have a length, it can be faster to compare
        if ( obj && obj.length !== undefined && (obj.length !== other.length) ) {
          return false;
        }
        /// if primitive we can directly compare
        if ( is.primitive(obj) && obj != other ) {
          return false;
        }
        /// if a wrapped primitive we can fail if the value doesn't compare
        /// but we can continue to test possible attached attribuets
        if ( is.primitiveObject(obj) && obj.valueOf() != other.valueOf() ) {
          return false;
        }
        /// otherwise, if the types don't match, fail
        if ( typeof obj !== typeof other) {
          return false;
        }
        if ( options && options.mode === t.compare.MODES.complete.by.remainder ) {
          return function(){
            var last = path.pop(), base = t.path.navigate(options.b, path), item = base[last];
            if ( base && (is.primitive(item) || is.empty(item)) ) {
              delete base[last];
            }
          };
        }
        /// walk will carry on walking
      }
    },
    /// the actual t.compare method
    method: function(a, b, mode){
      var opts = {mode: mode}, result = null;
      if ( is.NaN(a) && is.NaN(b) ) return true;
      if ( a === b ) { return true; }
      /// check early for simple stuff
      if ( t.compare.process(a, b, null, 0, []) === false ) { return false; }
      if ( !mode ) { mode = t.compare.partial; }
      if ( mode === t.compare.partial ) {
        result = t.walk(a, t.compare.process, true, b, opts) !== false;
      }
      else if ( t.chain.hasAncestor(mode, t.compare.MODES.complete) ) {
        if ( mode === t.compare.MODES.complete.by.remainder ) {
          opts.b = t.clone(b);
          result = t.walk(a, t.compare.process, true, b, opts) !== false;
          return result && is.empty(opts.b);
        }
      }
      /// this shouldn't happen
      return result;
    }
  }),
  
  /*
   * Simple strip HTML tags routine
   */
  stripTags: function( html ) {
    var container = document.createElement('div');
    container.innerHTML = html;
    html = container.textContent || container.innerText;
    container = null;
    return html;
  },
  
  /*
   * Trigger code later than now
   */
  later: t.wrapper(
    function(wrapper){
      return function(method, delay, context, args){
        if ( !is.number(delay) ) {
          args = context;
          context = delay;
          delay = 0;
        }
        var tid = new Number(setTimeout(function(){
          method.apply(context||this, args||[]);
        }, delay));
        tid.cancel = t.bind(wrapper.cancel, tid);
        return tid;
      };
    },
    {
      cancel: function(){
        delete this.cancel;
        clearTimeout(0 + this);
      }
    }
  ),
  
  /*
   * Defer any calls to a method until later (or never).
   */
  defer: function(method){
    var f = function(){ f.calls.push({context: this, args: arguments}); };
    f.method = method;
    f.calls = [];
    f.resolve = function(){
      for ( var i=0; i<f.calls.length; i++ ) {
        f.method.apply(f.calls[i].context, f.calls[i].args);
      }
    };
    f.reject = function(){
      f.calls.length = 0;
    };
    return f;
  },
  
  /*
   * Simple promise wrapper
   *
   * @namespace
   */
  promise: t.creator.callable({
    
    i: {},
    
    /*
     * Create a new promise
     */
    create: function(resolution){
      return this.prep.apply(Object.create(this), arguments);
    },
    
    /*
     * Create a list of promises that can be pushed to. The promises
     * will then be converted to either a Promise.all or Promise.race
     */
    list: t.creator.callable({
      
      i: {
        promises: null
      },
      
      prep: function(){
        this.i = Object.create(this.i);
        this.i.promises = [];
        return this;
      },
      
      add: function(item){
        this.i.promises.push( is.promise(item) ? item : new Promise(item) );
        return this;
      },
      
      getAll: function(){
        return Promise.all.call(Promise, this.i.promises);
      },
      
      getRace: function(){
        return Promise.race.call(Promise, this.i.promises);
      },
      
      get: function(){
        
      }
      
    }),
    
    prep: function(resolution){
      var self = this;
      this.i = Object.create(this.i);
      if ( resolution ) {
        this.i.resolution = function(resolve, reject){
          self.i.resolve = resolve;
          self.i.reject = reject;
          resolution && resolution.apply(self, arguments);
        };
        this.i.promise = new Promise(this.i.resolution);
      }
      return this;
    },
    
    then: function(resolved, rejected){
      if ( this.i.then ) {
        var i, a = this.i.then.slice(0), l = a.length;
        this.i.then.length = 0;
        for ( i=0; i<l; i++ ) {
          this.then.apply(this, a[i]);
        }
      }
      if ( arguments.length ) {
        if ( this.i.promise ) {
          this.i.promise.then.apply(this.i.promise, arguments);
        }
        else {
          if ( !this.i.then ) { this.i.then = []; }
          this.i.then.push(arguments);
        }
      }
      return this;
    },
    
    resolve: function(){ /// @TODO: chech that the promise isnt alrwady resolved.
      if ( this.i.resolve ) {
        this.i.resolve.apply(null, arguments);
      }
      else {
        this.i.promise = Promise.resolve.apply(Promise, arguments);
        this.then();
      }
      return this;
    },
    
    reject: function(){
      if ( this.i.resolve ) {
        this.i.reject.apply(null, arguments);
      }
      else {
        this.i.promise = Promise.reject.apply(Promise, arguments);
        this.then();
      }
      return this;
    },
    
    getPromise: function(){
      return this.i.promise;
    }
    
  }),
  
  /*
   * Simple deferred implementation
   *
   * @namespace
   */
  deferred: t.wrapper(function(wrapper){
    return function(local){
      return function(){
        return {
          reject: local.reject,
          done: local.done,
          fail: local.fail
        };
      };
    },
    {
      done: function(){

      },
      fail: function(){

      },
      reject: function(){

      }
    }
  }),
  
  /*
   * Take a string of markup and refactor it using the "browser's" standards
   */
  normalizeMarkup: function(markup){
    var div = document.createElement('div');
    div.innerHTML = markup;
    return div.innerHTML;
  },
  
  /*
   * Simple in-built testing framework -- it really doesn't need to be complicated.
   */
  test: function(descriptor){
    /// @TODO: Create a simple testing expect framework
    return descriptor;
  }
  
});

/*
 * @--alias theory
 */
t = theory;

/*
 * Stack the APIs
 *
 * @namespace
 */
t.apis = {};

/*
 * Theory will be designed to have loadable APIs
 */
t.apis['0.1'] = (function(t){
  /*
   * Build interactive UIs.
   */
  t.internal.ui = t.creator({
    
    /*
     *
     */
    internal: {
      testFor: {
        openTag: /^<[a-z]+/i,
        closeTag: /^<\/[a-z]+/i,
        autoTag: /\/>$/i
      },
      collectArguments: function(args){
        if ( args.length === 1 ) {
          if ( args[0].join ) {
            args = args[0];
          }
        }
        return args;
      },
      collectKeys: function(obj){
        return Object.keys(obj);
      }
    },
    
    /*
     *
     */
    prep: function(){
      this.i = this.internal = Object.create(this.internal);
      this.i.items = this.i.collectArguments(arguments);
      this.i.elements = [];
      var testFor = this.i.testFor;
      for ( var a=this.i.items, l=a.length, i=0, item, keys, key, val; i<l; i++ ) {
        item = a[i];
        keys = this.i.collectKeys(item);
        if ( keys.length === 1 ) {
          key = keys[0];
          val = item[key];
          if ( is.markupNormalized(val) ) {
            console.log('item', val);
          }
          else {
            if ( testFor.openTag.test(val) ) {
              console.log('open', val);
            }
            else if ( testFor.closeTag.test(val) ) {
              console.log('close', val);
            }
          }
        }
        else {
          
        }
        //this.i.elements = t.dom.fabricate(a[i]);
      }
      //console.log(this.i.elements);
      return this;
    },
    
    /*
     *
     */
    attach: function(){
      
    },
    
    /*
     *
     */
    extend: function(){
      return this.create.apply(this, arguments);
    }
    
  });
  
  /*
   * Basic UI for JSON Editing
   */
  t.internal.jsui = t.creator({
    
    internal: {
      
      ui: {
        base: null
      }
      
    },
    
    prep: function(){
      this.i = Object.create(this.internal);
      this.i.ui.base = t.dom([
        '<div style="border: 1px solid red">',
          'content',
        '</div>'
      ]);
      
      var base, views = {};
      
      base = t.ui([
        { 'base':                       '<div>' },
        {   'menu':                       '<aside>' },
        {     'menu-items':                 '<ul>' },
        {       'menu-item-add':              '<li><i></i>Add</li>' },
        {       'menu-item-remove':           '<li><i></i>Remove</li>' },
        {       'menu-item-change':           '<li><i></i>Change</li>' },
        {       'menu-item-something':        '<li><i></i>Something</li>' },
        {     '/menu-item':                 '</ul>' },
        {   '/menu':                      '</aside>' },
        {   'views':                      '<div />' },
        { '/base':                      '</div>' },
      {}]);
      
      base.attach([
        { 'meta.title':          'This is a test' },
        { 'meta.encoding':       '<meta charset="utf-8" />' },
        { 'meta.description':    '<meta name="description" content="This is a test" />' },
        { 'assets.css':          '<link href="css/base.css" />' },
        { 'assets.js':           '<script src="js/base.js"></script>' },
      {}]);
      
      views.tree = base.extend('views', [
        { 'view-tree':   '<section>' },
        { '/view-tree':  '</section>' },
      {}]);
      
      views.force = base.extend('views', [
        { 'view-force':  '<section>' },
        { '/view-force': '</section>' },
      {}]);
      
      views.force.attach(
        { 'assets.css':  'css/view-force.css' },
        { 'assets.js':   'js/view-force.js' }
      );
      
      return this;
    },
    
    appendTo: function(context){
      this.i.ui.base.appendTo(context);
      return this;
    },
    
    edit: function(obj, callback){
      
      return this;
    }
    
  });
  
  /*
  t.dom    = function(){ return kipple.resolve.apply(kipple, arguments); };
  t.string = function(context){ return t.internal.string.create(context); };
  t.array  = function(context){ return t.internal.array.create(context); };
  t.object = function(context){ return t.internal.object.create(context); };
  t.ui     = function(context){ return t.internal.ui.create(context); };
  t.jsui   = function(context){ return t.internal.jsui.create(context); };
  
  t.bind     = t.bind;
  t.unbind   = t.unbind;
  t.later    = t.later;
  t.deferred = t.deferred;
  */
  
  /*
   * If Object.keys exist, surely this should too?
   */
  Object.values = function(obj, filter){
    var a = [];
    for ( var key in obj ) {
      if ( !Object.prototype.hasOwnProperty || Object.prototype.hasOwnProperty.call(obj, key) ) {
        if ( filter && filter.call ) {
          if ( filter.call(null, key, obj[key]) === false ) continue;
        }
        a.push(obj[key]);
      }
    }
    return a;
  };
  
  return t;
  
})(t);

/*
 * A Matchbook is given a range of tokens, and from this it creates an internal 
 * lookup library. It is then responsible for reporting any of the tokens that 
 * match a given string at a particular offset. It was developed to help the
 * string parsing part of theory.js
 *
 *  E.g.
 *  var a = t.matchbook.create().add('will this match?', { mydata: 123 }).compile();
 *  a.compare('So I ask will this match?', 8); /// will this match?
 *
 * If `.compare()` is passed true as the third parameter then it will return the 
 * userdata associated with that token, rather that then token itself.
 *
 *  E.g.
 *  a.compare('So I ask Will this match?', 8, true); /// { mydata: 123 }
 *
 * ## Why Matchbook?
 *
 * A problem I always get stuck on is what is the fastest way to find a number of
 * symbols within a string, where each symbol represents the start and end of a 
 * range. The symbols can be any length, and they are likley to reoccur a number 
 * of times in different orders, the offset in the string is required. Here is 
 * the kicker though, I wish to ignore symbols that define sub-ranges within other
 * ranges i.e. "(a bracketed range (that has a sub range within) that we ignore)."
 * Out of the above example when searching for ( and ) the first bracket and the 
 * last bracket in the string should be found and their positions returned, 
 * everything else should be ignored.
 *
 * Obvioulsy the only way to do this is with some sort of stack or flag, tracking 
 * at what "depth" within a range a particular symbol is. That part isn't the problem, 
 * it's deciding which is best out of the following:
 *
 * 1. Use multiple indexOfs to find all occurances and put them in index order, 
 *      removing symbols that appear within ranges. This obviously wastes time
 *      if there are lots of subranges that will eventually be ignored.
 *
 * 2. Use a compiled regexp, built from the symbols to search for, find all, they 
 *      should already be in index order, removing symbols that appear within ranges.
 *      Again, similar to the indexOf problem, lots of sub ranges that would take
 *      effort to detect and remove.
 *
 * 3. Scan along the string using a for loop, matching against a precompiled 
 *      hash of character constructs. When finding a range start, indexOf until we 
 *      find the range end. A 'for' may be slower than an 'indexOf' or 'RegExp' but 
 *      this method skips out any removal of subranges.
 * 
 * This time around I think I'm going to go for option 3, but that could just be
 * down to the colour of the wind.
 *
 * @namespace
 */
t.matchbook = {
  
  escape: '\\',
  
  /*
   * Create a new Matchbook.
   */
  create: function( symbols ){
    return Object.create(this).prep(symbols);
  },
  
  /*
   * Clone this matchbook instance
   */
  clone: function(){
    var copy = t.matchbook.create();
        copy.symbols  = this.cloneItem(this.symbols);
        copy.data     = this.cloneItem(this.data);
        copy.compiled = this.compiled;
        copy.compiled && (copy.compile());
    return copy;
  },
  
  /*
   * Simple type cloning to allow this code to be stand-alone-complex
   *
   * @TODO: Only supports arrays and simple objects (i.e. not deep).
   */
  cloneItem: function( target ){
    if ( target && target.join ) {
      return target.slice(0);
    }
    else if ( target ) {
      var copy = {};
      for ( var i in target ) {
        copy[i] = target[i];
      }
      return copy;
    }
  },
  
  /*
   * Standard prep function to handle instance uniques.
   */
  prep: function(symbols){
    if ( symbols ) {
      this.compiled = false;
      this.symbols = symbols;
      this.library = this._createCharacterLibrary( this.symbols );
      this.data = {};
      this.length = this.symbols.length;
    }
    else {
      this.compiled = false;
      this.symbols = [];
      this.library = null;
      this.data = {};
      this.length = this.symbols.length;
    }
    return this;
  },
  
  /*
   * Take the list of symbols and construct a library that stores
   * each symbol as a chain of characters in a parent -> child
   * heirachy i.e. symbols of [cat, can, code] would become an object
   * like:
   *
   *     {c:{a:{t:'cat',n:'can'}},o:{d:{e:'code'}}}
   *
   * @NOTE: One special case is when a partial start of a full symbol
   * is used as a symbol in itself. i.e. 'apple' and 'app' -- in this
   * case this code will produce:
   * 
   *     {a:{p:{p:{'':'app',l:{e:'apple'}}}}}
   *
   * Where the empty key tells the rest of matchbook that a symbol
   * ends at this point within the object structure.
   */
  _createCharacterLibrary: function( symbols ){
    var a,i,l, lib = {}, pnt, c;
    for ( a=symbols, i=0, l=a.length; (pnt = lib) && i<l; i++ ) {
      this._addSymbolToLibrary( symbols[i], lib );
    }
    return lib;
  },
  
  /*
   * Handles adding an individual symbol to the library
   */
  _addSymbolToLibrary: function( symbol, library ){
    var a,i,l, lib = library || this.library, pnt = lib, c;
    for ( a=symbol, i=0, l=a.length; i<l; i++ ) {
      if ( (c = a[i]) ) { /// get the next char
        if ( i === l-1 ) { /// if we are the last char index
          if ( pnt[c] ) { /// if the char index already exists
            if ( typeof pnt[c] != 'string' ) { /// if the item found at char index is an object
              pnt[c][''] = a; /// set empty key to flag that a shorter symbol has reached the end
            }
          }
          else {
            pnt[c] = a;
          }
        }
        else if ( !pnt[c] ) {
          pnt[c] = {};
        }
      }
      pnt = pnt[c];
    }
  },
  
  /*
   * Compare this matchbook against the passed in string, at a particular offset.
   */
  compare: function( string, offset, getUserdata ){
    var c,a,s,p,i,l, match, ret, lib = this.library;
    /// escape support
    if ( this.escape ) {
      a = 0; i = offset||0;
      while ( string.charAt(--i) === this.escape ) { a++; };
      if ( a&1 ) {
        return false;
      }
    }
    p = false;
    for ( s=string, i=offset||0, l=s.length; (c=s.charAt(i)) && i<l; i++ ) {
      if ( lib[c] ) {
        lib = lib[c];
        if ( typeof lib === 'string' ) {
          return lib;
        }
        else if ( lib[''] ) {
          p = lib[''];
        }
      }
      else if ( p ) {
        break;
      }
      else {
        break;
      }
    }
    if ( p && getUserdata ) {
      p = this.userdata(p);
    }
    return p;
  },
  
  /*
   * Compile the symbols in to a fast searching object library.
   */
  compile: function(){
    this.library = this._createCharacterLibrary( this.symbols );
    this.compiled = true;
    return this;
  },
  
  /*
   * Add a new symbol, along with optinal userdata.
   */
  add: function( symbol, userdata ){
    if ( typeof symbol === 'string' ) {
      this.symbols.push( symbol );
      this.userdata( symbol, userdata );
      this.compiled && this._addSymbolToLibrary( symbol );
    }
    else if ( symbol && symbol.join ) {
      for ( var i=0, l=symbol.length; i<l; i++ ) {
        this.add( symbol[i], userdata );
      }
    }
    this.length = this.symbols.length;
    return this;
  },
  
  /*
   * Store or retrieve user data based on a symbol.
   */
  userdata: function( name, data, remove ){
    if ( arguments.length > 1 ) {
      if ( !this.data[name] ) {
        this.data[name] = [];
      }
      if ( remove ) {
        for ( var i=0, a=this.data[name]; i<a.length; i++ ) {
          if ( a[i] === data ) {
            a.splice(i, 1);
            break;
          }
        }
      }
      else {
        this.data[name].push(data);
      }
      return this;
    }
    else if ( arguments.length === 1 ) {
      return this.data[name];
    }
  }
  
};

/*
 * Theory's events handling -- designed to be mixed into other objects
 * or used as a standalone listener handler.
 *
 * @namespace
 */
t.events = t.creator.callable({
  
  /*
  theory: {
    mixins: [
      { context: t, item: 'events' }
    ],
    mixtos: ['on', 'off']
  },
  */
  
  i: {},
  
  prep: function(target){
    this.i = Object.create(this.i);
    this.i.target = target;
    return this;
  },
  
  getMixToList: function(){
    return ['on', 'off']
  },
  
  /*
   * There are four main ways this function can be called.
   *
   *  1. t.events.on -- directly (uses this)
   *  2. t.events().on -- instance based (uses this.i.target)
   *  3. other.on -- mixed into another object (with preserved context). (uses this.i.target)
   *  4. other.on -- mixed into another object (with other as context). (uses this)
   */
  on: function(){
    var target = this.i && this.i.target || this;
    
    if ( this.createdFrom ) {
      console.log(this.createdFrom.name);
    }
    
    target.test = 123;
    
    return this;
  },
  
  off: function(){
    return this;
  }
  
});

/**
 * Simplistic URL handling
 *
 * @memberof! theory
 * @namespace theory.url
 */
theory.url = t.method({
  attributes: {
    ///             "^(?:([^:/?#]+):)?(?://([^/?#]*))?([^?#]*)(\\?(?:[^#]*))?(#(?:.*))?"
    pattern: RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?")
  },
  method: function(url){
    var matches = url.match(t.url.pattern);
    return {
      protocol: matches[2],
      hostname: matches[4],
      pathname: matches[5],
      search: matches[7],
      hash: matches[9]
    };
  }
});

/**
 * Convert a path into an array of segments
 *
 * @memberof! theory.url
 * @method
 * @static
 */
theory.url.path = t.method({
  attributes: {
    pattern: t.ExpReg(/[^\/]+/g)
  },
  method: function(path){
    return t.array(t.url.path.pattern.haystack(path).map(0));
  }
});

/**
 * Theory's early dom handling -- it is used by Theory before 
 * {@linkcode theory.navigate t.navigate} has been loaded.
 *
 * It only supports rudimentary dom handling, which is mostly all that is 
 * required for the majority of script-prep.
 *
 * 1. Create basic elements
 * 2. Select elements using basic selectors
 *
 * @memberof! theory
 * @namespace theory.dom
 * @see theory.navigate
 * @todo the create elements part needs to be ported from kipple
 */
theory.dom = t.dom || t.creator.callable({
  
  i: null,
  
  prep: function(){
    this.i = {};
    this.i.items = [];
  },
  
 /**
  * Find elements using simplistic selectors, and does not require 
  * `document.querySelectorAll` to exist -- but it will use it if it does.
  *
  * Instead it uses a mixture of `getElementsByTagName`, 
  * `getElementsByClassName` and `childNode` navigation.
  *
  * This code is designed to be lightweight, and will **ONLY** support 
  * the most common/basic selectors. These include:
  *
  * 1. tag selectors
  * 2. classname selectors
  * 3. attribute selectors
  *
  * Before you ask why? This code is only used to help Theory boot -- 
  * it is not really designed to be used externally.
  *
  * ##### How it works
  *
  * This code relies on the user correctly breaking the selector up into 
  * its "particles" and "bits". E.g.
  *
  *     t.dom.find('body',['div','.classname'],['span',['@attribute','~=','123']]);
  *
  *     /// jQuery('body div.classname span[attribute~=123]');
  *
  * This saves quite a bit of processing and in library file size, but 
  * obviously at the cost of readability, user's code size and user error.
  *
  * Hence the reason this code is really only for Theory to use until 
  * something else better has loaded.
  *
  * - **particle** -- essentially an array of bits that require to be grouped, i.e. `['@attr', '=', '123']`
  * - **bit** -- a piece of a selector that can't be broken down any further, i.e. `'@attr'`, `'='`, or `'123'`
  *
  * The reason for the code only supporting the above three types of selector, 
  * is because I have only defined `bit` handlers for those three types. 
  * There is nothing to stop external code extending this with your own bit 
  * handlers, if you so wish.
  *
  * ##### Relationships / Combinators
  *
  * The only supported relationship selectors are  "descendant" (`body span`)
  * and "child" (`body > span`).
  *
  * More complex relationships like that of the adjacent sibling (`+`) and 
  * general sibling (`~`) combinators are not supported.
  *
  * ##### Why not use an existing CSS selector engine?
  *
  * The simplest answer to this is that I wanted this library to be self-sufficient
  * but didn't want to embed another 10k+ just to handle all selector edge-cases.
  * Especially when I tend to only use the most basic selectors from a code perspective.
  *
  * I am currently planning to add code to allow this dom handling to hand off to 
  * either jQuery or sizzle, if they are loaded.
  *
  * ##### Why not use `document.querySelectorAll`?
  *
  * Purely from a browser support perspective. True, nearly everything supports 
  *`querySelectorAll` quite well these days. But to have a core part of your 
  * library caught out even before it has fully booted because of a simple 
  * missing function isn't a very good place to be in.
  *
  * ##### Extensible
  *
  * As with nearly everything in Theory, you can extend the basic dom handling. This
  * can be achieved by adding to or changing handlers in the {@linkcode theory.dom.bits}
  * array.
  *
  * The `handler` function in each handler object should return a callback to test each 
  * element, and to specify whether the handler is to be run as a "find" operation (default)
  * or as a "filter".
  *
  * @example
  * // equivalent of `body .classname [title]`
  * // which would match: <body><span class="classname"><i title /></span></body>
  *
  * t.dom.findSimple('body', '.classname', '@title');
  *
  * @example
  * // equivalent of `body.classname [title]`
  * // which would match: <body class="classname"><span><i title /></span></body>
  *
  * t.dom.findSimple(['body', '.classname'], '@title');
  *
  * @example
  * // equivalent of `body.classname[title]`
  * // which would match: <body class="classname" title></body>
  *
  * t.dom.findSimple(['body', '.classname', '@title']);
  *
  * @example
  * // equivalent of `body.classname[title=example]`
  * t.dom.findSimple(['body', '.classname', ['@title', '=', 'example']]);
  *
  * @example
  * // equivalent of `body .classname[title=example]`
  * t.dom.findSimple('body', ['.classname', ['@title', '=', 'example']]);
  *
  * @example
  * // equivalent of `body > .classname[title=example]`
  * t.dom.findSimple('body', '>', ['.classname', ['@title', '=', 'example']]);
  *
  * @todo implement support for #ids
  *
  * @memberof! theory.dom
  * @method
  * @param {element} [context] Define the base element that this function will work from
  * @param {...(string|array)} [arguments] Define the particles and bits that make up your selector
  */
  findSimple: function(){
    if ( document.querySelectorAll ) {
      this.i.items = to.array(document.querySelectorAll(this.implodeQuery(arguments)));
    }
    else {
      this.i.items = this.explodedQuery(arguments);
    }
    return this;
  },
  
  /**
   * Take the simple query and work it back into an actual selector, so that it can be passed to `document.querySelectorAll`.
   *
   * @memberof! theory.dom
   * @method
   * @param {array} args Array of bits and particles to be built back into a selector string.
   */
  implodeQuery: function(args){
    for ( var query = '', i=0, a=args, l=a.length, item; i<l, item=a[i]; i++ ) {
      if ( item.join ) {
        if ( item[0].charAt(0) === '@' ) {
          item[0] = item[0].substring(1, item[0].length);
          switch ( item.length ) {
            case 1: item = '[' + item[0] + ']'; break;
            case 3: item = '[' + item[0] + item[1] + '"' + item[2] + '"]'; break;
            default: throw new Error('unable to understand implosion of attribute.'); break;
          }
        }
        else {
          item = item.join('');
        }
      }
      query += ' ' + item;
    }
    return query;
  },
  
  /**
   * explodedQuery allows for a more backward compatible way of describing
   * css selectors -- where the browser may not support querySelector. And
   * where Theory may not have string theory loaded. Its primary use is
   * to aid Theory code before everything is fully loaded and functional.
   *
   * @memberof! theory.dom
   * @method
   * @private
   */
  explodedQuery: function(args, context){
    /// support for passing the context as the first item in the args array
    if ( is.element(args[0]) ) { context = (args=to.array(args)).shift(); }
    /// support for passing no context at all
    if ( !context ) { context = document.documentElement; }
    context = this.explodedQueryParticle(args, context, {
      combinator: ' '
    });
    return context;
  },
  
  /**
   * Deal with the array parts i.e. "Particles" of a dom selector
   * each particle can be divided into smaller string "Bits"
   * each particle should represent an entire level in a dom selector
   * i.e. ['body', '.class-name'] or ['span', ':first-child'] or
   * ['@attribute', '=', 'something']
   *
   * @memberof! theory.dom
   * @method
   * @private
   */
  explodedQueryParticle: function(item, context, options, particle){
    if ( particle ) {
      particle.content = item;
      particle.level++;
    }
    for ( var i=0, a=item, l=a.length, bit, rest; i<l, bit=a[i]; i++ ) {
      if ( is.array(bit) ) {
        context = this.explodedQueryParticle(bit, context, options, particle || { level: 0 });
      }
      else if ( is.string(bit) ) {
        /// record where we are inside this particle
        if ( particle ) {
          particle.i = i;
        }
        /// combinators can only be changed outside of a particle
        else if ( bit === '>' ){
          if ( options.combinator === '>' ) {
            throw new Error('unexpected child combinator: ' + item.join(' '));
          }
          options.combinator = '>';
          continue;
        }
        else if ( bit === '+' || bit === '~' ) {
          throw new Error(bit + ' combinator not supported by t.dom at early load.');
        }
        context = this.explodedQueryParticleBit(bit, context, options, particle);
        /// revert the combinator
        if ( options.combinator !== ' ' ) {
          options.combinator = ' ';
        }
        /// move our cursor along if we used up more bits than just one.
        if ( particle && particle.i !== i ) {
          i = particle.i;
        }
      }
      /// if we have lost our way, escape.
      if ( !context ) break;
    }
    return context;
  },
  
  /**
   * Deal with string parts i.e. "Bits" of a dom selector
   * these can't be divided any further, they represent items
   * like 'body' or '=' or ':first-child' or '>'
   *
   * @memberof! theory.dom
   * @method
   * @private
   */
  explodedQueryParticleBit: function(bit, context, options, particle){
    for ( var result, i=0, a=this.bits, l=a.length, test; i<l, test=a[i]; i++ ) {
      if ( test.pattern === true || test.pattern.test(bit) ) {
        result = test.handler.apply(this, arguments);
        if ( result ) {
          break;
        }
      }
    }
    if ( result.callback ) {
      if ( result.filter ) {
        context = this.filterElementsBy(context, result.callback);
      }
      else if ( options.combinator === '>' ) {
        context = this.filterElementsBy(context, result.callback, true);
      }
      else {
        context = this.findElementsBy(context, result.callback);
      }
    }
    return context;
  },
  
  /**
   * You can extend the "bit" support by adding a handler to this array. Bits represent individual strings that make up a simplistic selector.
   *
   * The `handler` function in each handler object should return a callback to test each 
   * element, and to specify whether the handler is to be run as a "find" operation (default)
   * or as a "filter".
   *
   * An example handler, that checks an element against a classname.
   *
   *     {
   *       pattern: /^\./,
   *       handler: function(bit, context, options, particle){
   *         return {
   *           callback: this.getElementHasClassNameCheck(bit.substring(1, bit.length)),
   *           filter: !!particle
   *         };
   *       }
   *     },
   *
   * @memberof! theory.dom
   * @property {Array} bits array of objects, each object in the form:
   * 
   *     { pattern: /regexp/,
   *       handler: function(bit, context, options, particle){
   *         return {
   *           callback: function(element){ return true||false },
   *           filter: true||false
   *         }
   *     } }
   */
  bits: [
    /// handle classnames
    {
      pattern: /^\./,
      handler: function(bit, context, options, particle){
        return {
          callback: this.getElementHasClassNameCheck(bit.substring(1, bit.length)),
          filter: !!particle
        };
      }
    },
    /// handle attributes
    { 
      pattern: /^@/,
      handler: function(bit, context, options, particle){
        var result = {};
        bit = bit.substring(1, bit.length);
        /// @attribute should only appear at the start of a particle
        /// or, if it appears elsewhere, it can only be @attribute-name
        /// i.e. there can be no comparison symbol or value.
        if ( particle && particle.i === 0 ) {
          /// particle level of 1 means search, > 1 means filter.
          result.filter = particle.level > 1;
          switch ( particle.content.length ) {
            case 1: result.callback = this.getElementHasAttributeCheck(bit); break;
            case 3:
              result.callback = this.getElementHasAttributeCheck(bit, {
                comparison: particle.content[1],
                value: particle.content[2]
              });
              particle.i += 2;
            break;
            case 4:
              result.callback = this.getElementHasAttributeCheck(bit, {
                comparison: particle.content[1],
                value: particle.content[2],
                caseInsensitive: particle.content[3] === 'i'
              });
              particle.i += 3;
            break;
            default: throw new Error('unexpected format of attribute selector'); break;
          }
        }
        /// no particle, this can only be an @attribute-name search
        else {
          result.callback = this.getElementHasAttributeCheck(bit);
          result.filter = particle.i > 0;
        }
        return result;
      }
    },
    /// handle tag names
    {
      pattern: true,
      handler: function(bit, context, options, particle){
        return {
          callback: this.getElementHasTagNameCheck(bit),
          filter: false
        };
      }
    }
  ],
  
  /**
   * Scan through a list of elements, and their descendants.
   * Returns a list of those elements that caused the callback
   * to return true.
   *
   * @memberof! theory.dom
   * @method
   * @param {element|element[]} context A list of elements, or an singular element; used as the base context for the find operation.
   * @param {function} callback
   * @param {element} callback.(n) The callback expects its first argument to be an element
   * @param {boolean} callback.():returns The callback is expected to return a boolean.
   * @return {element[]} an array list of found elements.
   */
  findElementsBy: function(context, callback, result, depth){
    !result && (result = []);
    !depth && (depth = 0);
    if ( is.arraylike(context) ) {
      for ( var i=0, a=context, l=a.length, kid, res; i<l, kid=a[i]; i++ ) {
        if ( kid && (kid.nodeType === 1) ) {
          (depth > 0) && callback.call(this, kid) && result.push(kid);
          if ( kid.childNodes ) {
            this.findElementsBy(kid.childNodes, callback, result, depth + 1);
          }
        }
      }
    }
    else if ( is.element(context) ) {
      this.findElementsBy(context.childNodes, callback, result, depth);
    }
    if ( depth === 0 ) {
      return result;
    }
    else {
      return null;
    }
  },
  
  /**
   * Filter a list of elements using a callback.
   *
   * @memberof! theory.dom
   * @method
   * @param {element[]} list The list of elements to filter
   * @param {function} callback The callback will be used to test whether the current element should be filtered in (true) or out (false)
   * @param {element} callback.(n) The callback expects its first argument to be an element
   * @param {boolean} callback.():returns The callback is expected to return a boolean.
   * @return {element[]} an array list of filtered in elements.
   */
  filterElementsBy: function(list, callback, applyToChildren){
    for ( var result=[], i=0, a=list, l=a.length, res, kid; i<l, kid=a[i]; i++ ) {
      if ( kid && (kid.nodeType === 1) ) {
        if ( applyToChildren && kid.childNodes ) {
          (res = this.filterElementsBy(kid.childNodes, callback)) && (result = result.concat(res));
        }
        else {
          callback.call(this, kid) && result.push(kid);
        }
      }
    }
    return result;
  },
  
  /**
   * Return a closure that when called will tell if an element matches 
   * the particular classname.
   *
   * @memberof! theory.dom
   * @method
   * @private
   * @todo non-classList implementation required.
   */
  getElementHasClassNameCheck: function(classname){
    return function(elm){
      if ( elm && elm.classList ) {
        return elm.classList.contains(classname);
      }
      else {
        /// @TODO: non-classList implementation required.
      }
    }
  },
  
  /**
   * Return a closure that when called will tell if an element matches 
   * the particular attribute specification.
   *
   * @memberof! theory.dom
   * @method
   * @private
   */
  getElementHasAttributeCheck: function(attribute, opts){
    if ( opts && opts.comparison ) {
      //var qa = new RegExp('(^| )' + t.ExpReg.quote(attribute) + '( |$)');
      return function(elm){
        var v, m = false;
        if ( (v=elm.getAttribute(attribute)) ) {
          switch ( opts.comparison ) {
            case '=':  m = (v == opts.value); break;
            case '~=': m = (' '+v+' ').indexOf(opts.value) !== -1; break; /// @TODO:
            case '*=': m = v.indexOf(opts.value) !== -1; break;
            case '$=': m = v.lastIndexOf(opts.value) == v.length - opts.value.length; break;
            case '^=': m = v.indexOf(opts.value) === 0; break;
            case '|=': m = false; break; /// @TODO:
          }
        }
        return m;
      }
    }
    else {
      return function(elm){
        return elm.hasAttribute(attribute);
      }
    }
  },
  
  /**
   * Return a closure that when called will tell if an element has 
   * a particular tagname.
   *
   * @memberof! theory.dom
   * @method
   * @private
   */
  getElementHasTagNameCheck: function(tagname){
    tagname = tagname.toUpperCase();
    return function(elm){
      return elm && (elm.nodeName === tagname);
    };
  },
  
  /**
   * @memberof! theory.dom
   * @borrows theory.array.source as theory.dom.source
   * @see theory.array.source
   */
  source: t.internal.array.source,
  
  /**
   * @memberof! theory.dom
   * @borrows theory.array.each as theory.dom.each
   */
  each: t.internal.array.each,
  
  /**
   * Return the internal list of contextual items.
   *
   * @memberof! theory.dom
   * @method
   */
  getItems: function(){
    return this.i.items;
  },
  
  /**
   * Return the HTML of the current context, or the passed in parameter.
   *
   * @memberof! theory.dom
   * @method
   * @todo requires completion
   */
  html: function(param){
    if ( arguments.length ) {
      if ( is.element(param) ) {
        return param.nodeValue;
      }
      else {
      
      }
    }
    else {
      
    }
  }
  
});

/**
 * Theory's script inclusion handling -- allows for additional theory code
 * to be loaded later.
 *
 * @memberof! theory
 * @namespace theory.scripts
 * @todo enableDeferred() is still a work in progress and will allow theory code to be 
 * loaded using the script tag's defer attribute.
 */
theory.scripts = {
  
  enableDeferred: function(tname){
    t.dom.findSimple(document, ['noscript', ['@data-defered-until', '=', tname]])
      .each(function(elm, i){
        var html = t.dom.html(elm);
        console.log(html); /// @TODO: this is still a work in progress.
      })
    ;
  },
  
  discoverIncludes: function(){
    if ( typeof window == 'undefined' || typeof document == 'undefined' ) return;
    var tags = t.array(document.getElementsByTagName('script')),
        tag = tags.getLast(), 
        includes = tag ? t.attr(tag, 'data-t-includes') : '',
        src, path, list, tname
    ;
    /// skip this check out
    if ( includes == 'none' ) return;
    /// if no uses found
    if ( !includes ) {
      tag = document.querySelector ? document.querySelector('script[data-t-includes]') : false;
    }
    if ( tag ) {
      tname = t.attr(tag, 'data-t-name') || 'theory';
      src = t.attr(tag, 'src');
      if ( !includes ) { includes = t.attr(tag, 'data-t-includes'); }
      if ( includes ) {
        list = t.promise.list();
        path = t.url.path(t.url(src).pathname);
        t.array(includes.split(/,\s*/)).each(function(inc, i){
          inc = path.setLast('theory.' + inc + '.js').getJoined('/');
          list.add(t.scripts.include(inc));
        });
        list.getAll().then(function(tag){
          /// wait till the next execution cycle
          setTimeout(function(){
            t.scripts.enableDeferred(tname);
          }, 0);
        });
      }
    }
  },
  
  include: function(src){
    if ( typeof document != 'undefined' ) {
      var p = t.promise();
      var tag = document.createElement('script');
      tag.type = 'text/javascript';
      tag.async = true;
      tag.src = src;
      tag.addEventListener('load', function(){
        p.resolve(tag);
      });
      var last = t.array(document.getElementsByTagName('script')).getLast();
      last && last.parentNode.insertBefore(tag, last);
      return p;
    }
    else {
      /// @TODO: nodejs version
    }
  }
  
};

/// @TODO:
t.include = function(src){
  
};

/// support data-t-includes="..." on script tags
/// disabled for now.
0 && t.scripts.discoverIncludes();