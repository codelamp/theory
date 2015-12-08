describe("theory.matchbook", function(){
  
  describe(": matchbook basics", function(){
    
    /**
     * A Matchbook is given a range of tokens, and from this it
     * creates an internal lookup library. It is then responsible
     * for reporting any of the tokens that match a given string
     * at a particular offset.
     *
     * If .compare() is passed true as the third parameter then it
     * will return the userdata associated with that token, rather
     * that then token itself.
     */
    it(': compare against various tokens', function(){
      var a = t.matchbook.create()
        .add('[this:', {test:123})
        .add('[th:',   {test:456})
        .add('[thi',   {test:789})
        .compile()
      ;
      expect( a.compare('[this:', 0) ).toBe('[this:');
      expect( a.compare('[th:',   0) ).toBe('[th:');
      expect( a.compare('[thia',  0) ).toBe('[thi');
      expect( a.compare('[thi',   0) ).toBe('[thi');
      expect( a.compare('[ah',    0) ).toBe(false);
      expect( a.compare('[thi',   0, true) ).toEqual([{test:789}]);
    });
    
  });

});