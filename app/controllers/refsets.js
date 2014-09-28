export default Ember.ObjectController.extend({

	needs 			: ["data"],

	published 		: Ember.computed.alias("controllers.data.publishedRefsets"),
	unpublished 	: Ember.computed.alias("controllers.data.unpublishedRefsets"),
	
	init : function()
	{
	},
		
	getRefset : function(user,id)
	{
		var dataController = this.get('controllers.data');
		dataController.getRefset(user,id);
	},

	actions :
	{
		refresh : function()
		{
			Ember.Logger.log("controllers.refsets:actions:refresh");
			this.getAllRefsets(1);
		},
	}
});