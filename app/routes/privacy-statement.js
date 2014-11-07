export default Ember.Route.extend({
   model: function() {
	   return $.get("assets/static-content/privacy-statement.html");
   }
 });