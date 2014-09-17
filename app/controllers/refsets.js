import RefsetsAdapter from '../adapters/refsets';
var refsetsAdapter = RefsetsAdapter.create();

import MembersAdapter 	from '../adapters/simple-members';
var membersAdapter = MembersAdapter.create();

export default Ember.ObjectController.extend({

	allRefsets 		: [],
	dashboard 		: [],
	published 		: [],
	unpublished 	: [],
	model			: {},
	
	needs 			: ["login"],

	init : function()
	{
		this.getAllRefsets(1);
	},
	
	getAllRefsets : function(reinit)
	{
		var _this = this;
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		Ember.Logger.log("controllers.refsets:getAllRefSets");
	
		refsetsAdapter.findAll(user,reinit).then(function(result)
		{	
			var dashboardArray 		= [];
			var publishedArray 		= [];
			var unpublishedArray 	= [];
			
			_this.allRefsets.setObjects(result);
			
			result.map(function(item)
			{
				if (item.published)
				{
					dashboardArray.push(item);
					publishedArray.push(item);
				}
				else
				{
					unpublishedArray.push(item);					
				}
			});
			
			var sortedDashboardArray = dashboardArray.sort(function(a,b)
			{
			    return new Date(b.publishedDate) - new Date (a.publishedDate);
			});

			sortedDashboardArray = sortedDashboardArray.splice(0,5);
			
			_this.dashboard.setObjects(sortedDashboardArray);
			
			var sortedPublishedArray = publishedArray.sort(function(a,b)
			{
			    return new Date(b.publishedDate) - new Date (a.publishedDate);
			});			

			_this.published.setObjects(sortedPublishedArray);
		
			var sortedUnpublishedArray = unpublishedArray.sort(function(a,b)
			{
			    return new Date(b.publishedDate) - new Date (a.publishedDate);
			});			

			_this.unpublished.setObjects(sortedUnpublishedArray);
		});
	},
	
	getRefset : function(user,id)
	{
		var _this = this;
		
		var refset = refsetsAdapter.find(user,id).then(function(refsetData)
		{
			var idArray = refsetData.members.map(function(member)
			{
				return member.referenceComponentId;
			});
			
			membersAdapter.findList(user,idArray).then(function(result)
			{
				var membersData = result;
				
				if (result.status)
				{
					var conceptData = result.data;
															
					membersData = refsetData.members.map(function(member)
					{
						
						if (conceptData[member.referenceComponentId] !== null)
						{
							member.description = conceptData[member.referenceComponentId].label;
							member.found = true;
							member.conceptactive = conceptData[member.referenceComponentId].active;
						}
						else
						{
							member.description = 'concept not found';
							member.found = false;
						}
						
						return member;
						
					});	
				}
				else
				{
					Ember.Logger.log(result.error);
				}

				refsetData.members.setObjects(membersData);
				
				Ember.Logger.log("membersData",membersData);
				
			});
						
			_this.set("model",refsetData);
			return refsetData;
		});
		
		return refset;
	},
	
	actions :
	{
		refresh : function()
		{
			Ember.Logger.log("controllers.refsets:actions:refresh");
			this.getAllRefsets(1);
		}
	}
});