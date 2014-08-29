import NewsController from '../controllers/news';

var newsController 		= NewsController.create();

export default Ember.Route.extend({
	   model: function() 
	   {
		   return  newsController.model;
	   }
 });