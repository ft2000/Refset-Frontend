import ajax from 'ic-ajax';

var AllRefsets;

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
	
	findAll : function (user,reinit)
	{
		Ember.Logger.log("adapters.refsets:findAll (user,reinit)",user,reinit);
		
		var forceReinit = typeof reinit === "undefined" ? 0 : reinit;

		if (forceReinit || typeof AllRefsets === "undefined")
		{
			var result = ajax(RefsetENV.APP.refsetApiBaseUrl, {headers:this.getHeaders(user)}).then(function(result)
			{
				
				result.content.refsets.map(function(item)
				{
					
					if (typeof item.members !== "undefined")
					{
						item.numMembers = item.members.length;
					}
					else
					{
						item.numMembers = 0;
					}
				});
				
				return result.content.refsets;
			},
			function (error)
			{
				Ember.Logger.log("refsets findAll error",error);
				return [];	
			});

			AllRefsets =  result;
		}

		return AllRefsets;
	},
	
	find : function (user,id)
	{
		var result = ajax(RefsetENV.APP.refsetApiBaseUrl + '/' + id, {headers:this.getHeaders(user)}).then(function(result){
			
			var refset = result.content.refset;

			if (typeof refset.members === "undefined")
			{
				refset.members = [];	
			}

			result.content.refset.numMembers = result.content.refset.members.length;

			return refset;	
		},
		function (error)
		{
			Ember.Logger.log("refsets find error",error);
			return {authError : true};
		});	
		
		return result;
	},
	
	create : function (user,refset)
	{
		Ember.Logger.log("adapters.refsets:create",user,refset);
		
		var jsonFormatRefset = JSON.stringify(refset);

		var result = ajax(RefsetENV.APP.refsetApiBaseUrl + '/new', {headers:this.getHeaders(user), type:'post', data: jsonFormatRefset, processData: false, contentType: 'application/json'}).then(function(result)
		{
			return result;	
		},
		function (error)
		{
			Ember.Logger.log("create refset error",error);
			return {authError : true};

			// Needs more work here.  A failure might not just be an authenticate error...
		});	
		
		return result;
	},
	
	update : function (user,refset)
	{
		Ember.Logger.log("adapters.refsets:update",user,refset);
		
		var jsonFormatRefset = JSON.stringify(refset);

		var result = ajax(RefsetENV.APP.refsetApiBaseUrl + '/update', {headers:this.getHeaders(user), type:'post', data: jsonFormatRefset, processData: false, contentType: 'application/json'}).then(function(result)
		{
			return result;	
		},
		function (error)
		{
			Ember.Logger.log("update refset error",error);
			return {authError : true};
			
			// Needs more work here.  A failure might not just be an authenticate error...
		});	
		
		return result;
	},
	
	addMember : function (user,refsetId,referenceComponentId)
	{
		Ember.Logger.log("adapters.refsets:addMember (user,refsetId,referenceComponentId)",user,refsetId,referenceComponentId);

		var member = {referenceComponentId : referenceComponentId, active:true};
			
		var jsonFormatMemberData = JSON.stringify(member);
		
		var result = ajax(RefsetENV.APP.refsetApiBaseUrl + '/' + refsetId + '/add/member', {headers:this.getHeaders(user), method:"post", data: jsonFormatMemberData, processData: false, contentType: 'application/json'}).then(function(result)
		{			
			Ember.Logger.log("add member result",result);
			return result;
		},
		function (error)
		{
			Ember.Logger.log("adapters.refsets:addMember error",error);
			return [];
		});

		return result;	
	},
	
	getRefsetExport : function(user,id)
	{
		var result = ajax(RefsetENV.APP.refsetApiBaseUrl + '/' + id + '/export', {headers:this.getHeaders(user)}).then(function(result){
			return result;	
		},
		function (error)
		{
			Ember.Logger.log("refsets getRefsetExport error",error);
			return {authError : true};
		});	
		
		return result;

	},
	
});

