export default Ember.ObjectController.extend({

	needs : ["refsets","login"],
	
	user : Ember.computed.alias("controllers.login.user"),

	init : function()
	{
		// Check if user is still logged in...
		var loginController = this.get('controllers.login');
		loginController.loginFromLocalStore();

		// Get a list of Refsets
		var refsetController = this.get('controllers.refsets');
		refsetController.getAllRefsets();
	},	

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
		}
	},
	
});
