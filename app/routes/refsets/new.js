export default Ember.Route.extend({
	model: function() 
	{
		var newRefsetController = this.controllerFor('refsets.new');
		var uploadRefsetController = this.controllerFor('refsets.upload');

		return Ember.RSVP.hash({
			refset 					: newRefsetController.model,
			members 				: uploadRefsetController.members,
			doImportPublishedRefset	: newRefsetController.doImportPublishedRefset,
			doImportMembers 		: newRefsetController.doImportMembers,			
		});
	},

	actions :
	{
		initRefsetImport : function()
		{
			var newRefsetController = this.controllerFor('refsets.new');
			var loginController 	= this.controllerFor('login');
			
			var user = loginController.user;
			newRefsetController.create(user);
		},
	},	
 });