export default Ember.ObjectController.extend({
		
	needs 			: ["data","login"],

	refsetTypes 	: Ember.computed.alias("controllers.data.refsetTypes"),
	componentTypes 	: Ember.computed.alias("controllers.data.componentTypes"),
	moduleTypes 	: Ember.computed.alias("controllers.data.moduleTypes"),
	languageTypes 	: Ember.computed.alias("controllers.data.languageTypes"),
	
	published 		: Ember.computed.alias("controllers.data.publishedRefsets"),
	unpublished 	: Ember.computed.alias("controllers.data.unpublishedRefsets"),
	inactive	 	: Ember.computed.alias("controllers.data.inactiveRefsets"),
	user 			: Ember.computed.alias("controllers.login.user"),
	
	queryParams		: ['showUnpublished','showInactive'],
	 
	showUnpublished : 0,
	showInactive	: 0,

	initModel : function()
	{
		Ember.Logger.log("controllers.refsets.index:initModel");
		
		var _this 			= this;
		var dataController 	= this.get('controllers.data');
		
		// Run next so that we do not prevent the UI being displayed if the data is delayed...
		return Ember.run.next(function(){dataController.getAllRefsets(_this,'getAllRefsetsComplete');});
	},
	
	actions :
	{
		refresh : function()
		{
			Ember.Logger.log("controllers.refsets.index:actions:refresh");
			var dataController = this.get('controllers.data');
			dataController.getAllRefsets();
		},

		getAllRefsetsComplete : function(response)
		{
			Ember.Logger.log("controllers.refsets.index:actions:getAllRefsetsComplete (response)",response);

		},	
	}
	
});
