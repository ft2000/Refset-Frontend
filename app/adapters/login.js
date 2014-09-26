import ajax from 'ic-ajax';

export default Ember.Object.extend({
	
	authenticate: function(username, password) 
	{ 
	    Ember.Logger.log('adapters.login:authenticate');

	    var data = {};
		data.username  = username;
		data.password  = password;
		data.queryName = RefsetENV.APP.authenticationActionSoapName;

		var result = ajax(RefsetENV.APP.authenticationUrl, {type:'post', data: data}).then(function(success)
		{
			success.authenticated = true;
			
			return success;
		},
		function (error)
		{
			var result = {};
			
			result.authenticated = false;
			result.error = (error.errorThrown === "Unauthorized") ? 'Username and/or password not recognised' : 'Error accessing the authentication server';
			
			return result; 
		});	
		
		return result;
	},
 
	isPermittedToUseRefset: function(userId)
	{
		Ember.Logger.log('adapters.login:isPermittedToUseRefset');

		var result = ajax(RefsetENV.APP.appsUrl.replace('__USER_ID__', userId), {type:'get'}).then(function(permittedAppsResult)
		{
			return $.inArray(RefsetENV.APP.thisApplicationName,permittedAppsResult.apps) === -1 ? 0 : 1;
		},
		function (error)
		{
			Ember.Logger.log("adapters.login:isPermittedToUseRefset (error)",error);
			return -1;
		});	
		
		return result;
	},
	
});