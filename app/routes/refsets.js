import RefsetsController from '../controllers/refsets';

var controller = RefsetsController.create();

export default Ember.Route.extend({
           
	model: function() 
	{
		return Ember.RSVP.hash({
			published : controller.published,
			unpublished : controller.unpublished,
		});
	}
});