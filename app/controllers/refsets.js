import RefsetsAdapter from '../adapters/refsets';
 
var refsetsAdapter = RefsetsAdapter.create();

export default Ember.ObjectController.extend({

	allRefsets 		: [],
	dashboard 		: [],
	published 		: [],
	unpublished 	: [],

	getAllRefsets : function(reinit)
	{
		var _this = this;
		var user = this.get('globals.user');
		
		Ember.Logger.log("user",user);
		
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
		return refsetsAdapter.find(user,id);
	},
	
	create : function (user,refset)
	{		
		return refsetsAdapter.create(user,refset);
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