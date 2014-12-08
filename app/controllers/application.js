Ember.TextField.reopen(
{
	  attributeBindings: ['data-provide','data-date-format','data-date-clear-btn','data-date-autoclose','class','data-parsley-type','data-parsley-required-message','required']
});

Ember.TextArea.reopen({
	  attributeBindings: ['data-parsley-type','data-parsley-required-message','required','data-parsely-descriptioninuse','data-parsely-descriptioninuse-message']
});

export default Ember.ObjectController.extend({

	needs : ["login","data"],
	
	user : Ember.computed.alias("controllers.login.user"),
	
	logoutTimerDisplay 		: Ember.computed.alias("controllers.login.logoutTimerDisplay"),
	showLogoutTimer 		: Ember.computed.alias("controllers.login.showLogoutTimer"),
	autoLoggedOut			: Ember.computed.alias("controllers.login.autoLoggedOut"),
	logoutProgressDisplay	: Ember.computed.alias("controllers.login.logoutProgressDisplay"),

	init : function()
	{
		window.addEventListener("dragover",function(e)
		{
			e = e || event;
			e.preventDefault();
		},false);
		window.addEventListener("drop",function(e)
		{
			e = e || event;
			e.preventDefault();
		},false);
	},
	
	currentPathDidChange : function()
	{
		var newPath = this.get('currentPath');
		Ember.Logger.log("controllers.application:currentPathDidChange (path)",newPath);
		
		 window.document.title = newPath;
		 
		var controller = this.get('controllers.data');
		controller.applicationPathChanged();
	}.observes('currentPath'),

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
