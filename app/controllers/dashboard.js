export default Ember.ObjectController.extend({
	
	needs : ["data"],
	
	news 		: Ember.computed.alias("controllers.data.latestNews"),
	refsets 	: Ember.computed.alias("controllers.data.unpublishedRefsets"),
	
});