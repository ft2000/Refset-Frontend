import ajax from 'ic-ajax';

var AllRefsets;

export default Ember.Object.extend({
	findAll : function ()
	{
		if (typeof AllRefsets === "undefined")
		{
			var result = ajax(RefsetENV.APP.refsetApiBaseUrl).then(function(result){
				
				result.content.refsets.map(function(item){
					
					if (typeof item.members != "undefined")
						item.numMembers = item.members.length;
					else
						item.numMembers = 0;
				})
				
				return result.content.refsets;
			});

			AllRefsets =  result;
		}

		return AllRefsets;
	},
	
	find : function (id)
	{
		var result = ajax(RefsetENV.APP.refsetApiBaseUrl + '/' + id).then(function(result){

			result.content.refset.numMembers = result.content.refset.members.length;
			
			return result.content.refset;	
		});	

		return result;
	}
});