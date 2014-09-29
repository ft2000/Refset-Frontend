export default Ember.ObjectController.extend({

	needs 			: ["data","login"],

	published 		: Ember.computed.alias("controllers.data.publishedRefsets"),
	unpublished 	: Ember.computed.alias("controllers.data.unpublishedRefsets"),
	
	init : function()
	{
	},
	
	actions :
	{
		refresh : function()
		{
			Ember.Logger.log("controllers.refsets:actions:refresh");
			var dataController = this.get('controllers.data');
			dataController.getAllRefsets();
		},
	}
});