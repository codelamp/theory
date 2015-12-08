describe("theory.navigate", function(){
  
  describe('t.navigate() to step through an object', function(){
    
    var list = [];
    var b = t.object.navigate(
      {
        a: 1,
        b: 2,
        c: {
          d: 5,
          e: {
            f: 'hello',
            g: 'test',
            h: 'again'
          },
          test: {},
          ef: {
            f: 'oops'
          }
        }
      },
      { parents: true }
    );
    
    it(': .select() items with OPN containing $keyContains and ^begins-with', function(){
      /// @TODO: replace with .map() when it has been created
      b = b.select('c/^e/($keyContains f)').each(function(item){list.push(item);});
      expect(list).toEqual(['hello', 'oops']);
    });
    
  });
  
  xdescribe('t.navigate.configuration() >>> t.pockets', function(){
  
    /**
     * Create an instance of t.navigate() to handle Pockets.
     */
    t.pockets = t.navigate.configuration({
    
      hasChildren: function(target){
        return !!(target && target.children);
      },
    
      children: function(target, filter){
        var kids = (target && target.children) || [];
        if ( filter && filter.call ) {
          kids = kids.filter(function(val, key, array){
            return filter(target, val, key, array);
          });
        }
        else if ( is.string(filter) ) {
          kids = kids.filter(function(val, key, array){
            console.log(val, key);
            return true;
          });
        }
        return kids;
      },
    
      hasParent: function(target){
        return !!(target && target.parent);
      },
    
      parent: function(target){
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
        return !!(target && target.pocket);
      },
    
      resolve: function(target){
        /// @TODO:
        return false;
      }
    
    });
  
    var c = t.pockets({
    
      title: 'test',
      standfirst: 'this is a standfirst.',
      body: {
        type: 'full',
        data: 'this is the main body of information.'
      },
    
      parent: { pocket: '000005' },
    
      children: [
        { pocket: '000000' },
        { pocket: '000001' },
        { pocket: '000002' }
      ]
    
    });
    
    /// <--- before this code can work the pockets above would have to be resolved
    /// by default a "key" check for a pocket child list translates to checking the name/title.
    /// <--- promises are next with .then implementation.
    c.select('test').get().then(function(results){
      console.log(results);
    });
    
  });

});