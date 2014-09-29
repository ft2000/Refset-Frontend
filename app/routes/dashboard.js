export default Ember.Route.extend({

	beforeModel : function()
	{
		var _this 	= this;
		
		Ember.Logger.log("routes.dashboard:beforeModel");
		
		// Run next so that we do not prevent the UI being displayed if the data is delayed...
		return Ember.run.next(function(){_this.controllerFor('data').getAllRefsets();});
	},
	
});