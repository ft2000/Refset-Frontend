import RefsetAdapter from '../adapters/refsets';

export default Ember.ArrayController.extend({

	model : [],
	
	dashboard : [],

	getAllRefsets : function()
	{
		var adapter = RefsetAdapter.create();
		
		var _this = this;
		
		adapter.findAll().then(function(result)
		{
			_this.model.setObjects(result);
			
			var tempArray = [];
			
			result.map(function(item)
			{
				if (item.published)
				{
					tempArray.push(item);
				}	
			});
			
			var sortedArray = tempArray.sort(function(a,b)
			{
			    return new Date(b.publishedDate) - new Date (a.publishedDate);
			});

			sortedArray = sortedArray.splice(0,5);
			
			_this.dashboard.setObjects(sortedArray);	
		
		});
	},

	addARefset : function()
	{
		this.get("model").pushObject({description:"This is a row I just added automatically via a method on the controller!!!",published:true});
	},
	
	actions :
	{
		
		addData : function()
		{
			this.get("model").pushObject({description:"This is a row I just added vi an action on the controller!!!",published:true});
		}
		
	}
	
});
