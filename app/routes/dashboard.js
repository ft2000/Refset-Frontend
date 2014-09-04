import RefsetsController	from '../controllers/refsets';
import NewsController 		from '../controllers/news';

var refsetController 	= RefsetsController.create();
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