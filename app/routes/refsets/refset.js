export default Ember.Route.extend({
        		
	model: function(params) 
	{
		Ember.Logger.log("params",params);
		
		var _this = this;
		
		var loginController = this.controllerFor('login');
		var user = loginController.user;

		// Why is globals unavailable in the controller????
		
		var refsetController = this.controllerFor('refsets');
		var result = refsetController.getRefset(user, params.id);
		
		Ember.RSVP.Promise.all([result]).then(function()
		{
			Ember.Logger.log("promise done",result,result._result.authError);

			if (result._result.authError)
			{
				_this.controllerFor('application').send('showLoginForm');
				Ember.Logger.log("User needs to log in to access the API for this refset...");
			}
		});
		
		Ember.Logger.log("result",result);
		
		return result;
	},
	
	actions : 
	{
		showLoginForm: function() 
		{
			Ember.Logger.log('resfets:refset:showLoginForm');
			this.controllerFor('application').send('showLoginForm');
		},
	}
});