import RefsetController from '../controllers/refsets';
import NewsController from '../controllers/news';

var refsetController 	= RefsetController.create();
var newsController 		= NewsController.create();

export default Ember.Route.extend({

	model: function() 
	{
		return Ember.RSVP.hash({
			news 	: newsController.model,
			refsets : refsetController.model.filterBy('published',true)
		});
	}
});