export default Ember.Route.extend({
	model: function() 
	{
		var newRefsetController 	= this.controllerFor('refsets.new');
		var uploadRefsetController 	= this.controllerFor('refsets.upload');

		return Ember.RSVP.hash({
			refset 					: newRefsetController.model,
			members 				: uploadRefsetController.model,
			doImportPublishedRefset	: newRefsetController.doImportPublishedRefset,
			doImportMembers 		: newRefsetController.doImportMembers,			
		});
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