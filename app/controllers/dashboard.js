export default Ember.ObjectController.extend({

	needs : ["data","news"],

	news 				: Ember.computed.alias("controllers.news.latestNews"),

	latestPublicRefsets  : [],
			
	initModel : function()
	{

	},
	
	actions :
	{

	}
});