describe("theory.promise", function(){
  
  describe(".list()", function(){
  
    var promiseList = function(list){
      var promiseList = t.promise.list();
      promiseList.add(function(resolve, reject){
        setTimeout(function(){
          resolve('a');
        }, 100);
      });
      promiseList.add(function(resolve, reject){
        setTimeout(function(){
          resolve('b');
        }, 200);
      });
      return promiseList;
    };
  
    it(': t.promise.list() triggers .then() when .getAll() are completed', function(done){
      promiseList().getAll().then(function(args){
        expect( args ).toEqual(['a', 'b']);
        done();
      });
    });
  
    it(': t.promise.list() triggers .then() when .getRace() first is completed', function(done){
      promiseList().getRace().then(function(args){
        expect(args).toBe('a');
        done();
      });
    });
    
  });
  
});