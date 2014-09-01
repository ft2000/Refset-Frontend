import RefsetDataController from '../controllers/refset-data';

var controller = RefsetDataController.create();

export default Ember.Route.extend({
           
	model: function() 
	{
		return Ember.RSVP.hash({
			published : controller.published,
			unpublished : controller.unpublished,
		});
	}
});