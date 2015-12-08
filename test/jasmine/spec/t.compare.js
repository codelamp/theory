describe("theory.compare", function(){
  
  describe(": simple comparisons", function(){

    it('string comparison (same)',          function(){ expect( t.compare('hello', 'hello') ).toBe(true); });
    it('string comparison (short)',         function(){ expect( t.compare('hel', 'hello') ).toBe(false); });
    it('string comparison (longer)',        function(){ expect( t.compare('helloo', 'hello') ).toBe(false); });
    it('string comparison (different)',     function(){ expect( t.compare('goodbye', 'hello') ).toBe(false); });
  
  });
  
  describe(": compare primitives", function(){
  
    it('compare -0 to +0',                  function(){ expect( t.compare(+0, -0) ).toBe(true); });
    it('compare empty objects',             function(){ expect( t.compare({}, {}) ).toBe(true); });
    it('compare empty arrays',              function(){ expect( t.compare([], []) ).toBe(true); });
    it('compare empty strings',             function(){ expect( t.compare('', '') ).toBe(true); });
    it('compare nulls',                     function(){ expect( t.compare(null, null) ).toBe(true); });
    it('compare undefined',                 function(){ expect( t.compare(undefined, undefined) ).toBe(true); });
    it('compare NaN',                       function(){ expect( t.compare(NaN, NaN) ).toBe(true); });
    it('compare 123 to new Number(123)',    function(){ expect( t.compare(123, new Number(123)) ).toBe(false); });
    
  });

  /// t.compare checks for equivalence in complex cases, obviously short-circuits on direct === match
  describe(": complex comparisons", function(){

    it('same attribute in b',               function(){ expect( t.compare({a:123}, {a:123}) ).toBe(true); });
    it('missing attribute in b',            function(){ expect( t.compare({a:123}, {b:123}) ).toBe(false); });
    it('additional attribute in b',         function(){ expect( t.compare({a:123}, {a:123, c:456}) ).toBe(true); });
    it('additional attribute in b (c.b.r)', function(){
      expect(t.compare({a:123}, {a:123, c:456}, t.compare.MODES.complete.by.remainder)).toBe(false);
    });
    
  });

});