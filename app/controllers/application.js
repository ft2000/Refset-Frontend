export default Ember.ObjectController.extend({

	needs : ["refsets","login","utilities"],
	
	user : Ember.computed.alias("controllers.login.user"),
	
	loginExpiryLength : RefsetENV.APP.loginExpiry * 60,
	
	timeLeftToLogout : RefsetENV.APP.loginExpiry * 60, // convert minutes to seconds
	
	logoutTimerDisplay : function(){
		return 100 * this.timeLeftToLogout / this.loginExpiryLength;
	}.property("timeLeftToLogout"),

	init : function()
	{
		// Get a list of Refsets
		var refsetController = this.get('controllers.refsets');
		refsetController.getAllRefsets();
				
		this.logoutTimerRefresh();
		
		// Events handlers to detect ANY user interaction. Used to reset the logout timer.
	    $(document).mousemove(function () {
			var controller = Refset.__container__.lookup("controller:application");
			controller.send('resetLogoutTimer');
	    });
	    
	    $(document).keypress(function () {
			var controller = Refset.__container__.lookup("controller:application");
			controller.send('resetLogoutTimer');
	    });

	},	

	logoutTimerRefresh : function()
	{
		var _this = this;
		
		Ember.run.later(function()
		{
			var UtilitiesController = _this.get('controllers.utilities');
			var LoginController 	= _this.get('controllers.login');

			var userData = UtilitiesController.getDataFromSessionStore('user');

			var actualTimeout = _this.timeLeftToLogout;
			var user;

			if (userData.status === 'ok')
			{
				user 				= userData.data;
				actualTimeout 		= Math.max(user.logoutTimer,_this.timeLeftToLogout) -1;
				user.logoutTimer 	= actualTimeout;
				UtilitiesController.storeDataInSessionStore('user',user);
				LoginController.set("user",user);
			}
			
			_this.set("timeLeftToLogout",actualTimeout);
			_this.logoutTimerRefresh();
			
			if (actualTimeout === 0)
			{
				LoginController.send('logout');
			}
			
		},1000);
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
		},
		
		resetLogoutTimer : function()
		{
			this.set("timeLeftToLogout",this.loginExpiryLength);
			
			var UtilitiesController = this.get('controllers.utilities');
			var LoginController 	= this.get('controllers.login');
			
			var userData = UtilitiesController.getDataFromSessionStore('user');
			
			if (userData.status === 'ok')
			{
				var user = userData.data;

				user.logoutTimer = this.loginExpiryLength;
				UtilitiesController.storeDataInSessionStore('user',user);
				LoginController.set("user",user);
			}			
		},	

	},
	
});
