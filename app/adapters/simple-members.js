import ajax from 'ic-ajax';

export default Ember.Object.extend({
	
	getHeaders : function(user)
	{
		var headers =
		{
			'X-REFSET-PRE-AUTH-USERNAME'	: user.name,
			'X-REFSET-PRE-AUTH-TOKEN'		: user.token
		};

		return headers;
	}, 
	
	findList : function (user,idArray)
	{
		Ember.Logger.log("adapters.simple-members:findList");
		
		var jsonFormatIdArray = JSON.stringify(idArray);
	
		var result = ajax(RefsetENV.APP.conceptsApiBaseUrl, {headers:this.getHeaders(user), method:"post", data: jsonFormatIdArray, processData: false, contentType: 'application/json'}).then(function(result)
		{	
			var response = {};

			if (result.meta.message === "Success")
			{
				response.data 	= result.content.concepts;
				response.status = true;
			}
			else
			{
				Ember.Logger.log("adapters.simple-members:findList error",result.meta.message);

				response.error 	= result.meta.message;
				response.status = false;
			}
			
			return response;
		},
		function (error)
		{
			Ember.Logger.log("adapters.simple-members:findList error",error);

			var response 	= {};
			response.status	= false;
			response.error	= error;

			return response;
		});

		return result;

	},
	
	find : function (user,id)
	{
		Ember.Logger.log("adapters.simple-members:find",user,id);
		
		var result = ajax(RefsetENV.APP.conceptsApiBaseUrl + '/' + id, {headers:this.getHeaders(user), method:"get"}).then(function(result)
		{	
			var response = {};

			if (result.meta.message === "Success")
			{
				response.data 	={label: 'concept label goes here'}; //result.content.concept;
				response.status = true;
			}
			else
			{
				Ember.Logger.log("adapters.simple-members:find error",result.meta.message);

				response.error 	= result.meta.message;
				response.status = false;
			}
			
			return response;
		},
		function (error)
		{
			Ember.Logger.log("adapters.simple-members:find error",error);

			var response 	= {};
			response.status	= false;
			response.error	= error;

			return response;
		});

		return result;

	},

});