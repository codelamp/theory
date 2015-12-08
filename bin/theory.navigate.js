"use strict";

if ( typeof theory === 'undefined' ) {
  throw new Error('You must load theory.js first.');
}

/*
 * Theory's navigate handling -- allows for navigation around object structures
 * in a similar way to jQuery.
 *
 * @module theory
 * @class t.navigate
 */
t.internal.navigate = t.creator({
  
  theory: {
    prep: function(){
      this.shared.empty = this.create();
    },
    requirements: [
      function needIsJs(){ return typeof is != 'undefined' || new Error('This code requires is.js to be included.'); }
    ]
  },
  
  /*
   * .shared is reserved for attributes that require a shared instance
   * between instances of t.navigate(). By default methods are already shared.
   */
  shared: {
    simpleSelector: /^[a-z0-9 _.-]+$|^\*$/i,
    lispSelector: /^\(\$\w+/i,
    segmentedSelector: /\//,
    endsWithSelector: /(^[^\/]+\$$)|(^\*[^\/]+$)/,
    startsWithSelector: /(^\^[^\/]+$)|(^[^\/]+\*$)/,
    empty: null
  },
  
  /*
   * .i is reserved for internal data that is unique to this instance
   */
  i: {
    hasChildren: function(target){
      for ( var i in target ) {
        return true;
      }
      return false;
    },
    children: function(target, filter){
      return (is.literalObject(target) && Object.values(target, filter)) || [];
    },
    hasParent: function(target){
      return !!(target && target.parent);
    },
    parent: function(target, filter){
      if ( target.parent ) {
        if ( target.parent.call ) {
          return [target.parent()];
        }
        else {
          return [target.parent];
        }
      }
      return [];
    },
    needsResolving: function(target){
      return false;
    },
    resolve: function(target){
      /// @TODO: theory needs to utilise Promises
      return t.promise().resolve(target);
    }
  },
  
  /*
   * Return a new configuration of t.navigate().
   * This can be used to create a version that operates slightly differently.
   *
   * @TODO: this should be handled using t.creator.namespace
   */
  configuration: function(config){
    var obj = this.create();
    if ( config ) {
      config.hasChildren    && (obj.i.hasChildren    = config.hasChildren);
      config.children       && (obj.i.children       = config.children);
      config.hasParent      && (obj.i.hasParent      = config.hasParent);
      config.parent         && (obj.i.parent         = config.parent);
      config.needsResolving && (obj.i.needsResolving = config.needsResolving);
      config.resolve        && (obj.i.resolve        = config.resolve);
    }
    var caller = function(){ return obj.create.apply(obj, arguments); };
        caller.configuration = function(){
          return obj.configuration.apply(obj, arguments);
        };
    return caller;
  },
  
  /*
   * Create a new instance of `t.navigate()`
   *
   * @static
   * @method t.navigate.create
   * @param target {Object} The target object to navigate
   * @param [options] {Object} Configuration options
   * @param [options.parents] {Boolean} Enable automatic `t.navigate.applyParents` to target
   * @return {Object} an instance of `t.navigate`
   * @chainable
   */
  create: function(target, options){
    var ret = this.prep.apply(Object.create(this), arguments);
    ret.i.memories = Object.create(this.i.memories || {});
    return ret;
  },
  
  /*
   * Prep the new instance with references unique only to this instance.
   * leave everything else shared. This is automatically called by `.create()`
   *
   * @method prep
   * @param {Object} target
   * @param {Object} [options]
   * @return {Object} an instance of `t.navigate`
   * @chainable
   */
  prep: function(target, options){
    this.i = Object.create(this.i);
    this.i.targets = [];
    target && options && options.parents && (target = this.applyParents(target));
    target && (this.i.targets.push(target));
    return this;
  },
  
  /*
   * Recursively step an object structure and apply parent references
   * This is rather awkward when it comes to plain JS Objects, however,
   * for other data structures that already have parent references -- this
   * step won't be required -- .parent() will just work.
   *
   * @static
   * @method t.navigate.applyParents
   * @param obj {Object} The object to apply the parents to.
   * @param [maxDepth=100] {Number} To avoid possible circular loops.
   * @param [depth=0] {Number} Internal parameter to keep track of recursion depth.
   * @param [parent] {Function} Internal parameter for passing on the parent ref to recursed children.
   * @return {Object} the original object that was passed in (unless it was a primitive, in which case `t.promotePrimitive(obj)` is returned instead.
   */
  applyParents: function(obj, maxDepth, depth, parent){
    if ( !depth ) depth = 0;
    if ( !maxDepth ) maxDepth = 100; /// just in case
    if ( depth > maxDepth ) return obj;
    if ( !obj || obj.parent ) return obj;
    /// support being called directly with a primative
    if ( is.primitive(obj) ) {
      obj = t.promotePrimitive(obj);
      parent && (obj.parent = parent);
    }
    else {
      parent && (obj.parent = parent);
      var key, ref = this.createParentRef(obj);
      for ( key in obj ) {
        if ( key !== 'parent' && (!Object.prototype.hasOwnProperty || Object.prototype.hasOwnProperty.call(obj, key)) ) {
          obj[key] = this.applyParents(obj[key], maxDepth, depth + 1, ref);
        }
      }
    }
    return obj;
  },
  
  /*
   * Keep references to parents in closures to keep data exports clean
   *
   * @TODO: upgrade this to using Symbols with ES6
   */
  createParentRef: function(parent){
    return function(){return parent;};
  },
  
  /*
   * Similar to jQuery's pushStack -- allows the addition of new targets
   *
   * @method pushStack
   * @param {Array} items
   * @return {Object} the current instance of `t.navigate`
   * @chainable
   */
  pushStack: function(items){
    for ( var i=0, a=items, l=a.length, item; i<l; i++ ) {
      if ( (item=a[i]) ) {
        this.i.targets.push(item);
        if ( this.i.needsResolving(item) ) {
          if ( !this.i.resolving ) { this.i.resolving = []; }
          this.i.resolving[i] = this.i.resolve(item);
        }
      }
    }
    return this;
  },
  
  /*
   * Navigate an object's children, that are found using the 
   * internal children function. This defaults to looking for
   * an array under the key of "children".
   *
   * @example
   *
   * #### Simple usage:
   *
   *     t.navigate({children:[{a:1}, {b:2}, {c:3}]).children();
   *
   * #### Filter callback example:
   *
   *     t.navigate({children:[{a:1}, {b:2}, {c:3}]).children(function(key, val){
   *       return !!val.a;
   *     });
   *
   * @method children
   * @param {Array|String|Function} filter Filter in the children that will be matched, using either a string selector, a callback function or an array of either.
   * @return {Object} a new instance of `t.navigate`, containing matched children
   * @chainable
   */
  children: function(filter){
    var ret = this.create();
    for ( var i=0, a=this.i.targets, l=a.length; i<l; i++ ) {
      ret.pushStack( this.i.children(a[i], filter) );
    };
    return ret;
  },
  
  /*
   * Treat an object's keyed items as children. It will only navigate
   * down inside items that are objects.
   */
  each: function(callback){
    for ( var i=0, a=this.i.targets, l=a.length, item; i<l; i++ ) {
      item = a[i];
      if ( item && item.original ) { /// @TODO: is this a good idea?
        item = item.original;
      }
      callback && callback.call && callback.call(this, item, i);
    };
    return this;
  },
  
  /*
   * Remember a state accessible to all derived navigate objects
   */
  rem: function(name){
    name = name || 'default';
    this.i.memories[name] = this;
    return this;
  },
  
  /*
   * Recall a remembered state
   */
  rec: function(name){
    name = name || 'default';
    if ( this.i.memories && this.i.memories[name] ) {
      return this.i.memories[name];
    }
    else {
      return null;
    }
  },
  
  /*
   * From the current selection, move up the object structure
   *
   * @NOTE: This can only work if the object structure you are navigating
   * has a reference stored back up to the parent.
   */
  parent: function(filter){
    var ret = this.create();
    for ( var i=0, a=this.i.targets, l=a.length; i<l; i++ ) {
      ret.pushStack( this.i.parent(a[i], filter) );
    };
    return ret;
  },
  
  /*
   * List out the keys per each selected/targeted object
   */
  getKeys: function(){
    var ret = [];
    for ( var i=0, a=this.i.targets, l=a.length; i<l; i++ ) {
      ret = ret.concat(Object.keys(a[i]));
    };
    return ret;
  },
  
  /*
   * This method expects a selector in Object Path Notation.
   */
  select: function(opn, hint){
    var ret = this.shared.empty; /// @TODO: Should this.shared.empty be cloned?
    /// support for opn segments passed directly
    if ( is.literalObject( opn ) && opn.type ) {
      switch ( opn.type ) {
        case 'segment':
          ret = this.select(opn.string, opn);
        break;
      }
    }
    /// support for simple keyword selects
    else if ( opn === '' || this.shared.simpleSelector.test(opn) ) {
      switch ( opn ) {
        /// the "you didn't mean to end with slash" selector
        case '':
          return this;
        break;
        /// wildcard filter
        case '*':
          ret = this.children();
        break;
        /// parent filter
        case '..':
          ret = this.parent();
        break;
        /// otherwise assume child filter
        default:
          ret = this.children(opn);
        break;
      }
      return ret;
    }
    /// support for partial selectors, these aren't handled by OPN
    /// and so should be detected by the navigation code.
    else if ( this.shared.startsWithSelector.test(opn) ) {
      if ( opn.indexOf('*') !== -1 ) {
        opn = opn.substring(0, opn.length-1);
      }
      else if ( opn.charAt(0) === '^' ) {
        opn = opn.substring(1, opn.length);
      }
      else {
        opn = null;
      }
      if ( opn ) {
        return this.children(function(key, val){
          return key.indexOf(opn) === 0;
        });
      }
    }
    /// support for partial selectors, these aren't handled by OPN
    /// and so should be detected by the navigation code.
    else if ( this.shared.endsWithSelector.test(opn) ) {
      if ( opn.charAt(0) === '*' ) {
        opn = opn.substring(1, opn.length);
      }
      else if ( opn.indexOf('$') !== -1 ) { /// @TODO: should be more accurate
        opn = opn.substring(0, opn.length-1);
      }
      else {
        opn = null;
      }
      if ( opn ) {
        return this.children(function(key, val){
          return key.indexOf(opn) === 0;
        });
      }
    }
    /// support for functional selectors like ($keyContains ...)
    /// @TODO: Currently t.string() doesn't support the ability to describe
    /// a child group when there is no division. This means that ($key) can
    /// not be fully parsed down to (, $key, ) -- whereas ($key ...) is fine
    /// because it has a " " divider. For now lisp selectors will always
    /// require an argument -- which is likely to be the operational case
    /// anyway.
    else if ( this.shared.lispSelector.test(opn) ) {
      var name, func, args, kids = t.step(hint, 'children', 0, 'children', 0);
      switch ( kids.type ) {
        case 'spaces':
          if ( (args = kids && kids.children) ) {
            name = t.opn.wrap(args.shift()).string();
            func = t.step(t.internal.object, 'selectors', name);
            if ( func ) {
              args = t.opn.wrap(args).strings();
              return func.apply(this, args);
            }
            else {
              return t.error(Error('Unknown selector function ' + name));
            }
          }
        break;
      }
    }
    else {
      var notation = t.opn(opn),
          segments = notation.segments(),
          head = this,
          segment
      ;
      while ( +head && (segment=segments.next()) ) {
        head = head.select( segment );
      }
      ret = head;
    }
    return ret;
  },
  
  get: function(){
    return this.i.targets;
  },
  
  /*
   * Simple little hack to allow this object to existence check with a simple number cast
   */
  valueOf: function(){
    return this.i.targets.length ? 1 : 0;
  }
  
  /// @TODO: map would be useful!
  
});

/*
 * Set up some object selectors to improve t.object().select() support
 */
t.internal.object.selectors['$wildcardKey'] = t.method({
  method: function(){
    console.log(this, arguments);
  }
});

/*
 * Filter children based on a "contains" partial key.
 */
t.internal.object.selectors['$keyContains'] = t.method({
  method: function(filter){
    return this.children(function(key, val){
      return key.indexOf(filter) !== -1;
    });
  }
});

/// one instance that navigates normal objects
t.object.navigate = t.navigate = t.internal.navigate.configuration();