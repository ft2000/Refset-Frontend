import LoginAdapter	from '../adapters/login';
import User			from '../models/user';

var loginAdapter = LoginAdapter.create();

export default Ember.ObjectController.extend({

	needs 				: ["refsets","utilities","data"],

	loginDialogOpen		: false,			// Indicates that we have an open login dialog window
	autoLoggedOut		: false,			// Indicates that the user was logged out automatically through inactivity
	loginError			: null,				// Contains any relevant login error message
	username			: null,				// Bound to the login form input field
	password			: '',				// Holds the user's password between form entry and the authentication call
	user				: User.create(),	// A dummy user record. Overwritten upon login
	logoutDialogOpen	: false,			// Are we showing an auto-logout alert?
	loginDialogRef		: null,

	loginExpiryLength 	: RefsetENV.APP.loginExpiry * 60 * 1000, // Setting is in MINUTES, we need milliseconds here. This is the inactivity period before auto logout
	
	showLogoutTimer		: Ember.computed.lte("logoutTimerDisplay",200),	// Only show the logout progress bar if there are 100 seconds or less left until logout.
	
	logoutTimerDisplay 	: function() 		// A auto calculated property which returns how many seconds are left until user is automatically logged out
	{
		return this.getSecondsLeftToAutoLogout();
	}.property("user"),
	
	logoutProgressDisplay : function() 		// A auto calculated property which returns a range of 1-100 for the progress bar showing how long until user is automatically logged out
	{
		var secondsLeft = this.getSecondsLeftToAutoLogout();
		
		return (secondsLeft / 2);
	}.property("user"),
	
	showLoginForm : function()
	{
		var _this = this;
		
		// In case logout alert is showing, close it.
		this.send("closeLogoutAlertModal");
		
		if (!this.loginDialogOpen)
		{
			this.set("loginDialogOpen",true);
			
			var loginFormSource   = $("#login-form").html();
			var loginFormTemplate = Handlebars.compile(loginFormSource.replace(/(\r\n|\n|\r)/gm, ''));
			var context = {autoLoggedOut: this.autoLoggedOut, username: this.user.name, forgotPasswordLink:RefsetENV.APP.passwordResetURL,timeout:RefsetENV.APP.loginExpiry};
			var loginFormHTML = loginFormTemplate(context);
			
			var loginDialog = BootstrapDialog.show({
	            title: '<img src="assets/img/login.white.png"> Authentication Required',
	            closable: false,
	            message: loginFormHTML,
	            buttons: 
	            [
	             	{
	             		label		: 'Register',
	             		cssClass	: 'btn-default left',
	             		action		: function(dialog)
	             		{
	             			_this.set("loginDialogOpen",false);
	             			dialog.close();
	             			_this.showRegistrationForm();
	             		}
	             	},
	             	{
	             		label	: 'Continue as a guest',
	             		action	: function(dialog)
	             		{
	             			_this.set("loginDialogOpen",false);
	             			dialog.close();
	             		}
	             	},
	             	{
	             		label		: 'Login',
	             		cssClass	: 'btn-primary',
	             		icon		: 'glyphicon glyphicon-user',
	             		id 			: 'submit-btn',
	             		hotkey		: 13, // Enter key
	             		action 		: function(dialog)
	             		{
	             			var btn = this;
	             			btn.spin();

	             			_this.login($('#loginFormUsername').val(),$('#loginFormPassword').val()).then(function(loginResult)
	             			{
		             			if (loginResult)
		             			{
		             				_this.set("loginDialogOpen",false);
		             				dialog.close();
		             			}
		             			else
		             			{
			             			btn.stopSpin();		             									             				
		             			}
	             			});
	             		}
	             	}
	             ]
	        });	
			
			this.set("loginDialogRef",loginDialog);
		}
			
	},
	
	login : function(username,password)
	{
		var _this = this;
		
		return loginAdapter.authenticate(username,password).then(function(authResult)
		{
			var user = authResult.user;
			
			if (authResult.authenticated)
			{
				return loginAdapter.isPermittedToUseRefset(user.name).then(function(permissionResult)
				{
					if (permissionResult)
					{
						user.autoLogoutTime = new Date(new Date().getTime() + _this.loginExpiryLength);
						user.loginDeclined	= false;

						_this.saveUserToLocalStore(user);
         				_this.initUserInteractionEvents();
						
						var dataController = _this.get('controllers.data');
						dataController.authenticationStatusChanged();

						Bootstrap.GNM.push('Authenticated','You have sucessfully logged in', 'info');
					}
					else
					{
						Bootstrap.GNM.push('Unauthorised','You do not have permission to acccess this application', 'warning');
					}
					return permissionResult;
				});			
			}
			else
			{
				Bootstrap.GNM.push('Unauthorised','Your username and/or password were not accepted', 'warning');
				return false;
			}
			
		});
	},
	
	// Log the user out of the app
	logout : function()
	{
		var user = $.extend(true, {}, this.user);
		
		// This has the effect of logging the user out
		user.token = null;

		// Store our modified user record in the Local Store
		this.saveUserToLocalStore(user);

		// Since we changed authentication state, we need to refresh our list of refsets.
		// This will be moved to a common data refresh handler at a later date
		var dataController = this.get('controllers.data');
		dataController.authenticationStatusChanged();
		
		// No need to monitor user activity once they have been logged out
		this.stopUserInteractionEvents();
		
		// Show the login form
		this.showLoginForm();
	},
	
	registerButtons : 
	[
		Ember.Object.create({title: 'Cancel', clicked: 'closeRegistrationModal'}),
   		Ember.Object.create({title: 'Register', clicked:'registerUser', type:"primary"})
	],
	
	// Show the registration modal dialog
	showRegistrationForm: function() 
	{
		Bootstrap.ModalManager.open('registrationModal', '<img src="assets/img/login.png"> Snomed CT', 'registration', this.registerButtons, this); // modal ID, title, template (hbs), buttons, controller (usually this)
	},
	
   	init : function()
	{	
   		var _this = this;
   		
   	   	// When we start up we want to check the Local Store to see if the user may already be logged in
   		this.monitorLoginViaLocalStore();
   		setInterval(function(){_this.monitorLoginViaLocalStore();},1000);
		
		// Show the login form if needed
		if(this.user.token === null && !this.user.loginDeclined)
		{
			this.showLoginForm();
		}
	},

	// Calculates the number of seconds of inactivity remaining before the user will be auto logged out
	getSecondsLeftToAutoLogout : function()
	{
		var autoLogoutTime 		= new Date(this.user.autoLogoutTime);
		var timeLeftToLogout 	= parseInt((autoLogoutTime.getTime() - new Date().getTime()) /1000); // seconds

		if (this.user.token !== null && !this.logoutDialogOpen && timeLeftToLogout < 90)
		{
			this.set("logoutDialogOpen",true);
			Bootstrap.ModalManager.open('logoutModal', '<img src="assets/img/login.png"> Snomed CT', 'logout-alert', this.logoutButtons, this); // modal ID, title, template (hbs), buttons, controller (usually this)
		}

		return timeLeftToLogout;
	},

	// Check the Local Store every second to see if out user record has been overwritten by another window
	monitorLoginViaLocalStore : function()
	{
		var controller 	= this.get('controllers.utilities');
		var userData 	= controller.getDataFromSessionStore('user');
		var refreshData = false;

		if (userData.status === 'ok' && userData.data !== null)
		{
			// If user not logged in here, but has logged in on another window then we need to act as if the user has logged in here
			if (this.user.token === null && userData.data.token !== null)
			{
				this.initUserInteractionEvents();
				this.send('closeLoginModal');
				
				refreshData = true;
			}
			else
			{
				if (this.user.token !== null && userData.data.token === null)
				{
					refreshData = true;
				}				
			}
			
			// Save the user record from the Local Store into this controller
			this.set("user",userData.data);
			
			if (this.getSecondsLeftToAutoLogout() < 0)
			{
				this.send("closeLogoutAlertModal");
				this.showLoginForm();
			}
			
			if (refreshData)
			{
				var dataController 	= this.get('controllers.data');
				dataController.authenticationStatusChanged();				
			}

			// If we do not already have a username, then use the one from the Store. We only do this once, otherwise it will prevent you entering a username in the login form since it is bound to this value.
			if (this.name === null)
			{
				this.set("name",userData.data.name);				
			}
		}

		// Calculate how long the user has been inactive
		var timeLeftToAutoLogout = this.getSecondsLeftToAutoLogout();
		
		// If user is currently logged in and inactivity period has been exceeded then log the user out
		if (this.user.token !== null && timeLeftToAutoLogout <= 0)
		{
			// Enable the "you've been auto logged out" message in the login dialog
			Bootstrap.GNM.push('Session Timeout','You have been logged out after ' + RefsetENV.APP.loginExpiry + ' minutes of inactivity', 'warning');

			this.set("autoLoggedOut",true);
			this.logout();
		}
	},
	
	// Events handlers to detect ANY user interaction. Used to reset the inactivity timer.
	initUserInteractionEvents : function()
	{
	    $(document).mousemove(function () {
			var controller = Refset.__container__.lookup("controller:login");
			controller.send('resetAutoLogoutTimer');
	    });
	    
	    $(document).keypress(function () {
			var controller = Refset.__container__.lookup("controller:login");
			controller.send('resetAutoLogoutTimer');
	    });
	},

	// Disable the user interaction event handlers (when user is logged out)
	stopUserInteractionEvents : function()
	{
		// Stop bothering to monitor user events
	    $(document).unbind('mousemove');
	    $(document).unbind('keypress');
	},
	
	// Save the supplied user record both into this controller and into the Local Store
	saveUserToLocalStore : function(user)
	{
		this.set('user',user);
		
		var UtilitiesController = this.get('controllers.utilities');						
		UtilitiesController.storeDataInSessionStore('user',user);
	},

	actions : 
	{
		logout : function()
		{
			this.logout();
		},

		closeLoginModal : function()
		{
			if (this.loginDialogOpen)
			{
				this.loginDialogRef.close();
			}
			
			this.set("loginDialogOpen",false);
		},

		closeLogoutAlertModal: function()
		{
			if (this.logoutDialogOpen)
			{
				Bootstrap.ModalManager.close('logoutModal');
			}
			
			this.set("logoutDialogOpen",false);
		},

		closeRegistrationModal: function()
		{
			Bootstrap.ModalManager.close('registrationModal');
			
			this.set("loginDialogOpen",false);
 		},
		
		// For now registration consists only of opening the users mail client with some pre-filled in information.
		registerUser: function()
		{
			var regBody = "Name : " + this.regname + "%0A%0A";
			regBody += "Phone : " + this.regphone + "%0A%0A";
			regBody += "IHTSDO Login : " + this.reguser + "%0A%0A";
			regBody += "Nationality : " + this.regnationality + "%0A%0A";
			regBody += this.regnotes;
			
			window.location.href = 'mailto:' + RefsetENV.APP.RegistrationEmail + '?subject=Request for access to Snomed CT&body=' + regBody;
			this.send('closeRegistrationModal');
		},	
		
		// If user elects to use the app as a guest then we need to record that fact in order so we can choose not to show the login form if they open another window.
		continueAsGuest : function()
		{
			var user = $.extend(true, {}, this.user);
			user.loginDeclined = true;

			this.saveUserToLocalStore(user);
			
			Bootstrap.ModalManager.close('loginModal');
		},
		
		// This function is called every time the user makes any interaction with the browser - mouse move, or keypress
		// We reset the time the user will be auto logged out because of inactivity.
		resetAutoLogoutTimer : function()
		{
			this.send("closeLogoutAlertModal");

			var user = $.extend(true, {}, this.user);
			
			user.autoLogoutTime	= new Date(new Date().getTime() + this.loginExpiryLength);
						
			this.saveUserToLocalStore(user);
		},

	}
	
});