import RefsetDataAdapter from '../adapters/refset-data';

var adapter = RefsetDataAdapter.create();

export default Ember.ArrayController.extend({

	model : [],
	
	dashboard : [],
	published : [],
	unpublished : [],
	
	refset : {},

	getAllRefsets : function()
	{
		var _this = this;
		
		adapter.findAll().then(function(result)
		{
			_this.model.setObjects(result);
			
			var dashboardArray = [];
			var publishedArray = [];
			var unpublishedArray = [];
			
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

	getRefset : function(id)
	{
		var _this = this;
		
		adapter.find(id).then(function(result)
		{
			_this.set("refset",result);		
		});
	},
	
	actions :
	{
		showRefset : function(id)
		{
			this.getRefset(id);
		}
	}
		
});