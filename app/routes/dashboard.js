export default Ember.Route.extend({

	model: function()
	{
		var refsetController = this.controllerFor('refsets');
		var newsController = this.controllerFor('news');

		return Ember.RSVP.hash({
			news 	: newsController.getLatestNews(),
			refsets : refsetController.dashboard
		});
	},

});