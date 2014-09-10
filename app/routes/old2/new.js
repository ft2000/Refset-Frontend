import NewRefsetController	from '../../controllers/refsets';
var newRefsetController 	= NewRefsetController.create();

export default Ember.Route.extend({
	model: function() 
	{
		return Ember.RSVP.hash({
			refset 					: newRefsetController.model,
			members 				: newRefsetController.members,
			doImportPublishedRefset	: newRefsetController.doImportPublishedRefset,
			doImportMembers 		: newRefsetController.doImportMembers,			
		});
	},

	actions :
	{
		initRefsetImport : function()
		{
			var user = this.get('globals.user');
			newRefsetController.create(user);
		},
	},	
 });