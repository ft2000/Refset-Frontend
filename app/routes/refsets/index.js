export default Ember.Route.extend({
	controllerName : 'refsets',
	
	beforeModel : function()
	{
		var _this 	= this;
		
		Ember.Logger.log("routes.refsets:beforeModel");
		
		// Run next so that we do not prevent the UI being displayed if the data is delayed...
		return Ember.run.next(function(){_this.controllerFor('data').getAllRefsets();});
	},
	
	actions :
	{
		abortDataRequest : function(resourceType)
		{
			Ember.Logger.log("routes.refsets.index:actions:abortDataRequest (resourceType)",resourceType);
			// Need to just tell user that we can't display any refsets...
		},		
	}
});