import RefsetsAdapter from '../adapters/refsets';
var refsetsAdapter = RefsetsAdapter.create();

import MembersAdapter from '../adapters/simple-members';
var membersAdapter = MembersAdapter.create();

export default Ember.ObjectController.extend({

	needs 			: ["data"],

	published 		: Ember.computed.alias("controllers.data.publishedRefsets"),
	unpublished 	: Ember.computed.alias("controllers.data.unpublishedRefsets"),
	
	init : function()
	{
		var dataController = this.get('controllers.data');
	},
		
	getRefset : function(user,id)
	{
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