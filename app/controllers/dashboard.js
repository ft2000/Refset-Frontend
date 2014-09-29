export default Ember.ObjectController.extend({

	needs : ["data","news"],

	news 		: Ember.computed.alias("controllers.news.latestNews"),
	refsets 	: Ember.computed.alias("controllers.data.publishedRefsets"),

});