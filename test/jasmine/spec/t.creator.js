describe("theory.creator", function(){
  
  describe(": theory.creator basics", function(){
    
    var testDescription = {

      /** 
       * place code here that will get executed once the constructor description
       * has been handled by t.constructor(). This allows you to make modifications
       * to the object that can't be done midway through the literal object i.e.
       * those that require references to the constructor description itself.
       */
      theory: {
        prep: function(desc){
          /**
           * desc is the testDescription object, if you return anything from this
           * method it will override that of testDescription.
           */
        }
      },

      /**
       * This example just shows how to create a method that is wrapped in its
       * own private scope. Whatever you define as "wrapper:" will be passed
       * into that scope as arguments. Whatever you define as "method:" will
       * be called as t.constructor is processed. This method will be expected
       * to return a closure. That closure will be the method actually attached
       * to the constructor you are building, and it will retain the reference
       * to the original wrapper arguments.
       * 
       *   E.g. with the example below:
       *   console.log( test.create().exampleWithLocalObject );
       *   /// function(){ return wrapper.sharedReferenceMethod(); }
       *
       * This is designed for use-cases where you may require "private" code
       * that can be referenced locally i.e. without the use of a global entity.
       */
      exampleWithLocalObject: {
        wrapper: {
          sharedReferenceMethod: function(){
            return 123;
          }
        },
        method: function(wrapper){
          return function(){
            return wrapper.sharedReferenceMethod();
          };
        }
      },

      /**
       * "attributes:" is similar to "wrapper:", both can be used in conjunction,
       * but attributes should be used when you want the additional code or objects
       * to be accessible outside this functions scope.
       *
       *   E.g. the following would produce:
       *   console.log( test.create().exampleWithAttachedAttributes.externalMethod );
       *   /// function(){ return 123; }
       *
       * You can create many levels in this way -- if you really wanted to:
       *
       *   E.g.
       *   deepMethod: {
       *     attributes: {
       *       externalMethod: {
       *         attributes: {
       *           anotherMethod: function(){
       *             return 789;
       *           }
       *         },
       *         method: function(){
       *           return 456;
       *         }
       *       }
       *     },
       *     method: function(){ return 123; }
       *   }
       *
       *   console.log( test.create().deepMethod() ); // 123
       *   console.log( test.create().deepMethod.externalMethod() ); // 456
       *   console.log( test.create().deepMethod.externalMethod.anotherMethod() ); // 789
       */
      exampleWithAttachedAttributes: {
        attributes: {
          externalMethod: function(){
            return 123;
          }
        },
        method: function(){
          return this.exampleWithAttachedAttributes.externalMethod();
        }
      },

      /**
       *
       */
      exampleWithArguments: {
        method: {
          defaults: [[], 0],
          arguments: '[array, number]',
          method: function(args){
    
          }
        }
      },

      /**
       *
       */
      exampleWithSimpleOverloads: {
        overloads: {
          '[array, number]': function(list, count){
            return 'exampleWithSimpleOverloads (1)';
          },
          '[array, number, boolean]': function(list, count, flag){
            return 'exampleWithSimpleOverloads (2)';
          }
        }
      },

      /**
       *
       */
      exampleWithComplexOverloads: {
        overloads: {
          '[array:list] [object:options]?': function(args){
            return {
              handler: 1,
              passed: args
            };
          },
          '[object:item] [object:options]?': function(args){
            return {
              handler: 2,
              passed: args
            };
          }
        }
      },

      /**
       *
       */
      exampleWithMultipleOptionals: {
        overloads: {
          '[function:callback] [number:delay]? [object:options]?': function(args){
            return args;
          }
        }
      },

      /**
       *
       */
      exampleWithComplexOverloadsAndEverything: {
        overloads: [
          {
            defaults: [],
            arguments: '[array:list] [object:options]?',
            method: function(args){
              return 'exampleWithComplexOverloadsAndEverything (1)';
            }
          },
          {
            defaults: [],
            arguments: '[array:item, object:options]',
            method: function(args){
              return 'exampleWithComplexOverloadsAndEverything (2)';
            }
          }
        ]
      }

    };
    
    it(': expect .theory.prep to execute', function(){
      spyOn(testDescription.theory, 'prep');
      var test = t.creator(testDescription), a = test.create();
      expect( test.theory.prep ).toHaveBeenCalled();
    });
    
    it(': create method using wrapper', function(){
      var test = t.creator(testDescription), a = test.create();
      expect( a.exampleWithLocalObject() ).toBe(123);
    });
    
    it(': create method with attached attributes', function(){
      var test = t.creator(testDescription), a = test.create();
      expect( a.exampleWithAttachedAttributes.externalMethod ).toBeDefined();
      expect( a.exampleWithAttachedAttributes() ).toBe(123);
    });
    
    it(': create method with simple overloads', function(){
      var test = t.creator(testDescription), a = test.create();
      expect( a.exampleWithSimpleOverloads([], 123) )        .toBe('exampleWithSimpleOverloads (1)');
      expect( a.exampleWithSimpleOverloads([], 123, false) ) .toBe('exampleWithSimpleOverloads (2)');
      expect( a.exampleWithSimpleOverloads([], 123, true) )  .toBe('exampleWithSimpleOverloads (2)');
      expect(function(){ a.exampleWithSimpleOverloads(); })  .toThrowError(Error, 'Overload failed for []');
    });
    
    it(': create method with complex overloads', function(){
      var test = t.creator(testDescription), a = test.create();
      var r1 = a.exampleWithComplexOverloads(['a']);
      var r2 = a.exampleWithComplexOverloads(['a'], {b:1});
      var r3 = a.exampleWithComplexOverloads({a:1}, {b:1});
      var r4 = a.exampleWithComplexOverloads({a:1});
      
      expect( r1.handler ).toBe(1);
      expect( r2.handler ).toBe(1);
      expect( r3.handler ).toBe(2);
      expect( r4.handler ).toBe(2);
      
      expect( r1.passed ).toEqual({list:['a']});
      expect( r2.passed ).toEqual({list:['a'], options:{b:1}});
      expect( r3.passed ).toEqual({item:{a:1}, options:{b:1}});
      expect( r4.passed ).toEqual({item:{a:1}});
      
      expect(function(){ a.exampleWithComplexOverloads(123); }).toThrowError(Error, 'Overload failed for [number]');
    });
    
    it(': create method with multiple optionals', function(){
      var test = t.creator(testDescription), a = test.create(), f = function(){};
      var r1 = a.exampleWithMultipleOptionals(f);
      var r2 = a.exampleWithMultipleOptionals(f, 1000);
      var r3 = a.exampleWithMultipleOptionals(f, 1000, {options:true});
      
      expect( r1 ).toEqual({callback: f});
      expect( r2 ).toEqual({callback: f, delay: 1000});
      expect( r3 ).toEqual({callback: f, delay: 1000, options: {options: true}});
    });
    
  });
  
  describe(": theory.creator.callable()", function(){
    
    var a = theory.creator.callable({
      woodchuck: function(){
        return 'how much?';
      }
    });
    
    it(': creator is callable', function(){
      
      expect( a.call ).toBeDefined();
      expect( a.apply ).toBeDefined();
      expect( typeof a ).toBe('function');
      
    });
    
    it(': callable creator returns expected structure', function(){
      
      var b = a();
      expect( b.woodchuck ).toBeDefined();
      expect( b.woodchuck.call ).toBeDefined();
      expect( b.woodchuck() ).toBe('how much?');
      
    });
    
  });
  
  describe(": namespacing", function(){
    
    var a = t.events(),           /// instance of t.events
        b = t.events.namespace(), /// a new namespace of t.events
        c = b(),                  /// an instance of namespaced t.events
        d = b.namespace()         /// a namespace from a namespace
    ;
    
    it(': t.events.namespace() is namespaced of t.events',                      function(){ expect( b.isNamespacedOf(t.events) ).toBe(true); });
    it(': t.events.namespace().namespace() is namespaced of t.events',          function(){ expect( d.isNamespacedOf(t.events) ).toBe(true); });
    it(': t.events.namespace().namespace() is namespaced t.events.namespace()', function(){ expect( d.isNamespacedOf(b) ).toBe(true); });
  
  });
  
  describe(": prototyping", function(){
    
    var a = t.events(),           /// instance of t.events
        b = t.events.namespace(), /// a new namespace of t.events
        c = b(),                  /// an instance of namespaced t.events
        d = b.namespace(),        /// a namespace from a namespace
        f = (function(){          /// just to prove than an instance's protoOf works
          var f = function(){};
          f.prototype = a;
          return new f();
        })()
    ;
    
    it(': t.events is prototype of t.events()',                          function(){ expect( t.events.isPrototypeOf(a) ).toBe(true); });
    it(': t.events is prototype of t.events.namespace()',                function(){ expect( t.events.isPrototypeOf(b) ).toBe(true); });
    it(': t.events.namespace() is prototype of t.events.namespace()()',  function(){ expect( b.isPrototypeOf(c) ).toBe(true); });
    it(': t.events() is prototype of obj with prototype = t.events()',   function(){ expect( a.isPrototypeOf(f) ).toBe(true); });
    
  });

});