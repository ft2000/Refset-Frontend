import RefsetsAdapter from '../adapters/refsets';
var refsetsAdapter = RefsetsAdapter.create();

export default Ember.ObjectController.extend({

	model : [],
	dashboard : [],
	published : [],
	unpublished : [],
	
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
			var model				= [];
			
			result.map(function(item)
			{
				model.push(item);
				
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
	
	getRefset : function(id)
	{
		var user = this.get('globals.user');

		return refsetsAdapter.find(user,id);
	},
	
	actions :
	{
		showRefset : function(id)
		{
			this.getRefset(id);
		},
	}
});