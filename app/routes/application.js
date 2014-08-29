import RefsetController from '../controllers/refsets';

var refsetController 	= RefsetController.create();

export default Ember.Route.extend({
	
	init : function()
	{
		refsetController.getAllRefsets();	
	},

});