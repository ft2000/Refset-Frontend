import ajax from 'ic-ajax';

export default Ember.Object.extend({
	
	getHeaders : function(user)
	{
		var headers =
		{
			'X-REFSET-PRE-AUTH-USERNAME'	: user.username,
			'X-REFSET-PRE-AUTH-TOKEN'		: user.token
		};

		return headers;
	}, 
	
	findList : function (user,idArray)
	{
		Ember.Logger.log("adapters.simple-members:findList (user,idArray)",user,idArray);
		
		var jsonFormatIdArray = JSON.stringify(idArray);
	
		var result = ajax(RefsetENV.APP.conceptsApiBaseUrl, {headers:this.getHeaders(user), method:"post", data: jsonFormatIdArray, processData: false, contentType: 'application/json'}).then(function(result)
		{				
			return result.content.concepts;
		},
		function (error)
		{
			Ember.Logger.log("adapters.simple-members:findList error",error);
			return [];
		});

		return result;

	},

});