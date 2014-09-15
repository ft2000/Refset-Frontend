export default Ember.ObjectController.extend({

	needs : ["login"],
	
	user : Ember.computed.alias("controllers.login.user"),
	
	logoutTimerDisplay 		: Ember.computed.alias("controllers.login.logoutTimerDisplay"),
	showLogoutTimer 		: Ember.computed.alias("controllers.login.showLogoutTimer"),
	autoLoggedOut			: Ember.computed.alias("controllers.login.autoLoggedOut"),
	logoutProgressDisplay	: Ember.computed.alias("controllers.login.logoutProgressDisplay"),
	
	actions :
	{
		showLoginForm: function() 
		{
			var controller = this.get('controllers.login');
			controller.showLoginForm();
		},

		showRegistrationForm: function() 
		{
			var controller = this.get('controllers.login');
			controller.showRegistrationForm();
		},

		logout : function()
		{
			var controller = this.get('controllers.login');
			controller.logout();
		},		
	},
});
