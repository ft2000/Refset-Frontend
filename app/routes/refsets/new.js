export default Ember.Route.extend({
	
	beforeModel : function()
	{
		Ember.Logger.log("routes.refsets.new:beforeModel");
		this.controllerFor('refsets.new').createEmptyRefset();
	},

	actions :
	{
		initRefsetImport : function()
		{
			var newRefsetController = this.controllerFor('refsets.new');
			newRefsetController.create(this.refset);
		},
	
		abortDataRequest : function(resourceType)
		{
			Ember.Logger.log("routes.refsets.new:actions:abortDataRequest (resourceType)",resourceType);
			// Depends what we are doing here... getting member data or saving the refset
		},	
	},	
 });