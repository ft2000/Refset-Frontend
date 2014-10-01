export default Ember.Route.extend({

   model: function(params){
       return this.controllerFor('data').initialiseAppData().then(function(){
           // it is better to return the actual model here, and not the promise itself
           return true;
       });
   },
       
});