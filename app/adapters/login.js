import ajax from 'ic-ajax';

export default Ember.Object.extend({
	
	authenticate: function(username, password) 
	{ 
	    Ember.Logger.log('Ajax: authenticate');
		var data = {};
		data.username  = username;
		data.password  = password;
		data.queryName = RefsetENV.APP.authenticationActionSoapName;

		var result = ajax(RefsetENV.APP.authenticationUrl, {type:'post', data: data}).then(function(success)
		{
			Ember.Logger.log('Ajax: success');
			return (success);
		},
		function (error)
		{
			Ember.Logger.log('Ajax: error');
			return error; 
		});	
		
		return result;
	},
  
	isPermittedToUseRefset: function(userId)
	{
		Ember.Logger.log('Checking if user is permitted to access app: ' + RefsetENV.APP.thisApplicationName);
	    
		var result = ajax(RefsetENV.APP.appsUrl.replace('__USER_ID__', userId), {type:'get'}).then(function(permittedAppsResult)
		{
			Ember.Logger.log('Ajax: success' + JSON.stringify(permittedAppsResult));
			return $.inArray(RefsetENV.APP.thisApplicationName,permittedAppsResult.apps) === -1 ? 0 : 1;

		},
		function (error)
		{
			Ember.Logger.log('Ajax: error' + JSON.stringify(error));
			return error.errorMessage;
		});	
		
		return result;
	},
	
});