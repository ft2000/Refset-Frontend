export default Ember.Route.extend({

   model: function(){
       return this.controllerFor('data').initialiseAppData().then(function(){
           return true;
       });
   },
       
});