export default Ember.Route.extend({
        		
	model: function(params) 
	{
		Ember.Logger.log("params",params);
		
		var _this = this;
		
		var loginController = this.controllerFor('login');
		var user = loginController.user;

		var refsetController = this.controllerFor('refsets');
		var result = refsetController.getRefset(user, params.id);

		// We need to pause here foe the above promise to be fulfilled so we can check the Auth Status
		Ember.RSVP.Promise.all([result]).then(function()
		{
			if (result._result.authError)
			{
				_this.controllerFor('application').send('showLoginForm');
				Ember.Logger.log("User needs to log in to access the API for this refset...");
			}
		});
		
		return result;
	},
	
	actions : 
	{
		showLoginForm: function() 
		{
			Ember.Logger.log('routes.resfets.refset:actions:showLoginForm');
			this.controllerFor('application').send('showLoginForm');
		},

		updateRefset : function()
		{
			Ember.Logger.log("routes.refsets.refset:actions:updateRefset");
		},	

		exportRefset : function()
		{
			Ember.Logger.log("routes.refsets.refset:actions:exportRefset");
		},	
	}
});