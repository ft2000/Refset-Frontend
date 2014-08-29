var Login = Ember.Object.extend({
  username:     null,
  password:     null,
  token:		null
});

Login.reopenClass({
	authenticate: function(username, password) 
	{ 
	    Ember.Logger.log('Ajax: authenticate');
		var data = {};
		data.username  = username;
		data.password  = password;
		data.queryName = RefsetENV.APP.authenticationActionSoapName;

		return Ember.Deferred.promise(function(p) 
		{
			return p.resolve($.ajax({
				url: RefsetENV.APP.authenticationUrl,
				type: "POST",
				data: data
			}).then((function(success) 
				{
					Ember.Logger.log('Ajax: success');
					return (success);
				}), 
				
				function(error) 
				{
					Ember.Logger.log('Ajax: error');
					return error; 
				}));
		});
	},
  
	isPermittedToUseRefset: function(userId)
	{
		Ember.Logger.log('Checking if user is permitted to access app: ' + RefsetENV.APP.thisApplicationName);
	    
		return Ember.Deferred.promise(function(p)
		{
			return p.resolve($.ajax({

				url: RefsetENV.APP.appsUrl.replace('__USER_ID__', userId),
				type: "GET"
			}).then((
					
				function(permittedAppsResult) 
				{
					Ember.Logger.log('Ajax: success' + JSON.stringify(permittedAppsResult));
					return $.inArray(RefsetENV.APP.thisApplicationName,permittedAppsResult.apps) === -1 ? 0 : 1;
				}), 
				
				function(error)
				{
					Ember.Logger.log('Ajax: error' + JSON.stringify(error));
					return error.errorMessage;
				}
			));
		});
	},
	  
  getPermissionGroups: function(userId){
    Ember.Logger.log('Ajax: Get permissionGroups for user ' + userId);
    return Ember.Deferred.promise(function(p) {
      return p.resolve($.ajax({
        url: RefsetENV.APP.permissionsUrl.replace('__USER_ID__', userId),
        type: "GET"
      }).then((function(success) {
        Ember.Logger.log('Ajax: success');
        return success;
      }), function(error) {
        Ember.Logger.log('Ajax: error');
        Ember.Logger.log('fail: ' + JSON.stringify(error));
        return error;
      }));
    });
  },

});

export default Login;