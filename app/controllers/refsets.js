import RefsetsAdapter from '../adapters/refsets';
var refsetsAdapter = RefsetsAdapter.create();

import MembersAdapter 	from '../adapters/simple-members';
var membersAdapter = MembersAdapter.create();

export default Ember.ObjectController.extend({

	allRefsets 		: [],
	dashboard 		: [],
	published 		: [],
	unpublished 	: [],
	
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
			
			// Need these dates formatted for easy display
			refsetData.formattedCreatedDate 	= _this.dateFormat(refsetData.created);
			refsetData.formattedPublishedDate 	= _this.dateFormat(refsetData.publishedDate);
			
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
							member.description 		= conceptData[member.referenceComponentId].label;
							member.conceptactive 	= conceptData[member.referenceComponentId].active;
							member.found 			= true;
							member.published 		= (typeof member.effectiveTime !== "undefined");
						}
						else
						{
							member.description 		= 'concept not found';
							member.found 			= false;
							member.published 		= false;
						}
						
						return member;
						
					});	
				}
				else
				{
					Ember.Logger.log(result.error);
				}

				refsetData.members.setObjects(membersData);
			});
			
			return refsetData;
		});
		
		return refset;
	},
	
	dateFormat : function(date)
	{
		return $.formatDateTime('MM dd, yy', new Date(date));
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