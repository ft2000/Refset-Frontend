export default Ember.ObjectController.extend({

	needs : ["data","news"],

	news 		: Ember.computed.alias("controllers.news.latestNews"),
	refsets 	: Ember.computed.alias("controllers.data.publishedRefsets"),

	initModel : function()
	{
		Ember.Logger.log("controllers.dashboard:initModel");
		
		var _this 			= this;
		var dataController 	= this.get('controllers.data');
		
		// Run next so that we do not prevent the UI being displayed if the data is delayed...
		return Ember.run.next(function(){dataController.getAllRefsets(_this,'getAllRefsetsComplete');});
	},
	
	actions :
	{
		getAllRefsetsComplete : function(response)
		{
			Ember.Logger.log("controllers.dashboard:actions:getAllRefsetsComplete (response)",response);

		},	
	}
});