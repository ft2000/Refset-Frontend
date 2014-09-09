export default Ember.ObjectController.extend({

	needs : ["refsets","login"],

	init : function()
	{
		var controller = this.get('controllers.refsets');
		controller.getAllRefsets();
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
	}
	
});
