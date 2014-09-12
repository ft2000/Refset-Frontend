import LoginAdapter	from '../adapters/login';
import User			from '../models/user';

var Login = LoginAdapter.create();

export default Ember.ObjectController.extend({

	needs 				: ["refsets","utilities"],

	loginDialogOpen		: false,			// Indicates that we have an open login dialog window
	loginInProgress 	: false,			// Indicates that an API call to the authentication server is currently in progress
	autoLoggedOut		: false,			// Indicates that the user was logged out automatically through inactivity
	loginError			: null,				// Contains any relevant login error message
	username			: null,				// Bound to the login form input field
	password			: '',				// Holds the user's password between form entry and the authentication call
	user				: User.create(),	// A dummy user record. Overwritten upon login

	loginExpiryLength 	: RefsetENV.APP.loginExpiry * 60 * 1000, // Setting is in MINUTES, we need milliseconds here. This is the inactivity period before auto logout
	
	showLogoutTimer		: Ember.computed.lte("logoutTimerDisplay",100),	// Only show the logout progress bar if there are 100 seconds or less left until logout.
	
	logoutTimerDisplay 	: function() 		// A auto calculated property which returns how many seconds are left until user is automatically logged out
	{
		return this.getSecondsLeftToAutoLogout();
	}.property("user"),
	
	// Define the buttons used on the login and register modal dialogs
	loginButtons: 
	[
		Ember.Object.create({title: 'Register', clicked:'showRegistrationForm'}),
   	    Ember.Object.create({title: 'Continue as a Guest', clicked: 'continueAsGuest'}),
   		Ember.Object.create({title: 'Login', clicked:'loginUser', type:"primary"})
   	],

   	registrationButtons: 
   	[
   		Ember.Object.create({title: 'Cancel', clicked: 'closeRegistrationModal'}),
   		Ember.Object.create({title: 'Register', clicked:'registerUser', type:"primary"})
   	],
	

   	init : function()
	{	
   	   	// When we start up we want to check the Local Store to see if the user may already be logged in
		this.monitorLoginViaLocalStore();
		
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
		
		return timeLeftToLogout;
	},
	
	// Check the Local Store every second to see if out user record has been overwritten by another window
	monitorLoginViaLocalStore : function()
	{
		var controller 	= this.get('controllers.utilities');
		var userData 	= controller.getDataFromSessionStore('user');

		if (userData.status === 'ok')
		{
			// If user not logged in here, but has logged in on another window then we need to act as if the user has logged in here
			if (this.user.token === null && userData.data.token !== null)
			{
				this.initUserInteractionEvents();
				this.send('closeLoginModal');
			}
			
			// Save the user record from the Local Store into this controller
			this.set("user",userData.data);

			// If we do not already have a username, then use the one from the Store. We only do this once, otherwise it will prevent you entering a username in the login form since it is bound to this value.
			if (this.username === null)
			{
				this.set("username",userData.data.username);				
			}
		}

		// Calculate how long the user has been inactive
		var timeLeftToAutoLogout = this.getSecondsLeftToAutoLogout();
		
		// If user is currently logged in and inactivity period has been exceeded then log the user out
		if (this.user.token !== null && timeLeftToAutoLogout <= 0)
		{
			// Enable the "you've been auto logged out" message in the login dialog
			this.set("autoLoggedOut",true);
			this.logout();
		}

		var _this = this;

		// Run this function again in 1000 milliseconds time
		Ember.run.later(function()
		{
			_this.monitorLoginViaLocalStore();
		},1000);
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
	
	// Show the login modal dialog
	showLoginForm: function()
	{
		this.set("loginDialogOpen",true);
		Bootstrap.ModalManager.open('loginModal', '<img src="assets/img/login.png"> Snomed CT Login', 'login', this.loginButtons, this); // modal ID, title, template (hbs), buttons, controller (usually this)
	},

	// Show the registration modal dialog
	showRegistrationForm: function() 
	{
		return Bootstrap.ModalManager.open('registrationModal', '<img src="assets/img/login.png">  Snomed CT Registration', 'registration', this.registrationButtons, this);
	},
	
	// Log the user out of the app
	logout : function()
	{
		var user = this.user;
		
		// This has the effect of logging the user out
		user.token = null;

		// Store our modified user record in the Local Store
		this.saveUserToLocalStore(user);

		// Since we changed authentication state, we need to refresh our list of refsets.
		// This will be moved to a common data refresh handler at a later date
		var refsetController = this.get('controllers.refsets');		
		refsetController.getAllRefsets(1);
		
		// No need to monitor user activity once they have been logged out
		this.stopUserInteractionEvents();
		
		// Show the login form
		this.showLoginForm();
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
		// Perform the user authentication
		loginUser: function()
		{
			var _this = this;

			_this.set("loginInProgress",1);
			_this.set('loginError', null);
			
			// Start by authenticating the user
			Login.authenticate(this.username,this.password).then(function(authResult)
			{
				// If we authenticated then we proceed
				if (authResult.authenticated)
				{
					var loggedInUser = User.create({
						username		: authResult.user.name,
						firstName		: authResult.user.givenName,
						lastName		: authResult.user.surname,
						token			: authResult.user.token,
						autoLogoutTime 	: new Date(new Date().getTime() + _this.loginExpiryLength),
						loginDeclined	: false
					});

					// Reset the password field now that we have finished with it.
					_this.set('password', '');			
					
					// Check if the user is permitted to access this refset application
					Login.isPermittedToUseRefset(loggedInUser.username).then(function(isAllowedAccessToRefset)
					{
						_this.set('loginInProgress', 0);

						switch(isAllowedAccessToRefset)
						{
							case 1: // Yes, user is permitted
							{
								_this.send('closeLoginModal');

								// Save the username so it gets used next time the user logs in
								_this.set("username",loggedInUser.username);
								
								_this.saveUserToLocalStore(loggedInUser);
								
								// Refresh the refset list so that we get the private ones as well as public ones.
								// This will be moved to a central data refresh handler at a later date
								var refsetsController = _this.get('controllers.refsets');
								refsetsController.getAllRefsets(1);
								
								// Start monitoring user interactions for the auto-logout handler
								_this.initUserInteractionEvents();

								break;
							}
							
							case 0: // No, user is not permitted
							{
								_this.set('loginError', "You do not have access to this application");
								break;
							}
							
							case -1: // Error communicating with the authentication server
							{
								_this.set('loginError', authResult.error);
								break;
							}
						}		
					});
				}
				else // Failed to authenticate the user
				{
					_this.set('loginInProgress', 0);
					_this.set('loginError', "Username and password not recognised");
				}
			});
		},
		
		logout : function()
		{
			this.logout();
		},
		
		// For now registration consists only of opening the users mail client with some pre-filled in information.
		registerUser: function()
		{
			Ember.Logger.log('try to register user...');
			
			var regBody = "Name : " + this.regname + "%0A%0A";
			regBody += "Phone : " + this.regphone + "%0A%0A";
			regBody += "IHTSDO Login : " + this.reguser + "%0A%0A";
			regBody += "Nationality : " + this.regnationality + "%0A%0A";
			regBody += this.regnotes;
			
			window.location.href = 'mailto:' + RefsetENV.APP.RegistrationEmail + '?subject=Request for access to Snomed CT&body=' + regBody;
			this.send('closeRegistrationModal');
		},
		
		// Close the login modal window
		closeLoginModal: function()
		{
			// Since we can try to do this at app startup, we need to check if the modal is open since it causes an error if it is not.
			if (this.loginDialogOpen)
			{
				Bootstrap.ModalManager.close('loginModal');
			}

			this.set("autoLoggedOut",false);		
		},

		closeRegistrationModal: function()
		{
			return Bootstrap.ModalManager.close('registrationModal');
		},

		// If user elects to use the app as a guest then we need to record that fact in order so we can choose not to show the login form if they open another window.
		continueAsGuest : function()
		{
			var user = this.user;
			user.loginDeclined = true;

			this.saveUserToLocalStore(user);
			
			Bootstrap.ModalManager.close('loginModal');
		},
		
		// This function is called every time the user makes any interaction with the browser - mouse move, or keypress
		// We reset the time the user will be auto logged out because of inactivity.
		resetAutoLogoutTimer : function()
		{
			Ember.Logger.log("controllers.login:resetAutoLogoutTimer");
			
			var user = this.user;
			
			user.autoLogoutTime	= new Date(new Date().getTime() + this.loginExpiryLength);
			
			this.saveUserToLocalStore(user);
		},

		// Used by the login form to open the register window instead
		showRegistrationForm : function()
		{
			Bootstrap.ModalManager.close('loginModal');
			this.showRegistrationForm();
		}
	}
	
});