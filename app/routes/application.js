import RefsetController from '../controllers/refset-data';

var refsetController 	= RefsetController.create();

export default Ember.Route.extend({
	
	init : function()
	{
		refsetController.getAllRefsets();	
	},

});