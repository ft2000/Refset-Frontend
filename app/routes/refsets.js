import RefsetController from '../controllers/refsets';

var controller = RefsetController.create();

export default Ember.Route.extend({
		
	init : function()
	{
		controller.getAllRefsets();	
	}
});