import RefsetDataController from '../controllers/refset-data';
import NewsController from '../controllers/news';

var refsetController 	= RefsetDataController.create();
var newsController 		= NewsController.create();

export default Ember.Route.extend({

	model: function() 
	{
		return Ember.RSVP.hash({
			news 	: newsController.getLatestNews(),
			refsets : refsetController.dashboard
		});
	},


});