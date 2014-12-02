export default Ember.ObjectController.extend({

	needs : ["data","news"],

	news 				: Ember.computed.alias("controllers.news.latestNews"),
	publishedRefsets 	: Ember.computed.alias("controllers.data.publishedRefsets"),
	unpublishedRefsets 	: Ember.computed.alias("controllers.data.unpublishedRefsets"),
	inactiveRefsets 	: Ember.computed.alias("controllers.data.inactiveRefsets"),

	latestPublicRefsets  : [],
			
	initModel : function()
	{
		Ember.Logger.log("controllers.dashboard:initModel");
		
		var _this 			= this;
		var dataController 	= this.get('controllers.data');
		
		Ember.run.later(function()
		{
			var allRefsets = Ember.copy(_this.get("publishedRefsets"));					
			_this.latestPublicRefsets.setObjects(allRefsets.splice(0,3));
		},2000);
		
		
		// Run next so that we do not prevent the UI being displayed if the data is delayed...
		return Ember.run.next(function()
		{
			dataController.getAllRefsets(_this,'getAllRefsetsComplete');
		});
	},
	
	actions :
	{
		getAllRefsetsComplete : function(response)
		{
			Ember.Logger.log("controllers.dashboard:actions:getAllRefsetsComplete (response)",response);
		},	
	}
});