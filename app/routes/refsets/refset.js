import RefsetsController from '../../controllers/refsets';

var controller = RefsetsController.create();

export default Ember.Route.extend({
           
	model: function(params) 
	{
		return controller.getRefset(params.id);
	}
});