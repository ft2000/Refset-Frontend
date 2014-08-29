import RefsetController from '../controllers/refsets';

var refsetController 	= RefsetController.create();

export default Ember.Route.extend({

	model: function() 
	{
		return  refsetController.model;
	}
});