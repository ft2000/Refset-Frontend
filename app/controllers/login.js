import LoginAdapter	from '../adapters/login';
import User			from '../models/user';

var Login = LoginAdapter.create();

export default Ember.ObjectController.extend({

	needs 				: ["refsets","utilities"],

	loginInProgress 	: false,
	loginError			: null,
	password			: '',
	username			: null,
	user				: User.create(),

	loginExpiryLength 	: RefsetENV.APP.loginExpiry * 60 * 1000, // Setting is in MINUTES, we need milliseconds here
	
	showLogoutTimer		: Ember.computed.lte("logoutTimerDisplay",100),
	
	logoutTimerDisplay : function()
	{
		return this.getSecondsLeftToAutoLogout();
	}.property("user"),
	
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
		this.monitorLoginViaLocalStore();
		
		if(this.user.token === null && !this.user.loginDeclined)
		{
			this.showLoginForm();
		}
	},
	
	monitorLoginViaLocalStore : function()
	{		
		var controller 	= this.get('controllers.utilities');
		var userData 	= controller.getDataFromSessionStore('user');

		if (userData.status === 'ok')
		{
			if (this.user.token === null && userData.data.token !== null)
			{
				this.initUserInteractionEvents();
				this.send('closeLoginModal');
			}
			
			this.set("user",userData.data);

			if (this.username === null)
			{
				this.set("username",userData.data.username);				
			}
		}

		var timeLeftToAutoLogout = this.getSecondsLeftToAutoLogout();
		
		if (this.user.token !== null && timeLeftToAutoLogout <= 0)
		{
			this.logout();
		}

		var _this = this;

		Ember.run.later(function()
		{
			_this.monitorLoginViaLocalStore();
		},1000);
	},
	
	getSecondsLeftToAutoLogout : function()
	{
		var autoLogoutTime 		= new Date(this.user.autoLogoutTime);
		var timeLeftToLogout 	= parseInt((autoLogoutTime.getTime() - new Date().getTime()) /1000); // seconds
		
		return timeLeftToLogout;
	},
	
	initUserInteractionEvents : function()
	{
		// Events handlers to detect ANY user interaction. Used to reset the logout timer.
	    $(document).mousemove(function () {
			var controller = Refset.__container__.lookup("controller:login");
			controller.send('resetAutoLogoutTimer');
	    });
	    
	    $(document).keypress(function () {
			var controller = Refset.__container__.lookup("controller:login");
			controller.send('resetAutoLogoutTimer');
	    });
	},

	stopUserInteractionEvents : function()
	{
		// Stop bothering to monitor user events
	    $(document).unbind('mousemove');
	    $(document).unbind('keypress');
	},
	

	showLoginForm: function()
	{
		return Bootstrap.ModalManager.open('loginModal', '<img src="assets/img/login.png"> Snomed CT Login', 'login', this.loginButtons, this); // modal ID, title, template (hbs), buttons, controller (usually this)
	},
	
	logout : function()
	{
		var controller 	= this.get('controllers.utilities');
		var userData 	= controller.getDataFromSessionStore('user');
		var user;
		
		if (userData.status === 'ok')
		{
			user = userData.data;
			user.token = null;
		}
		else
		{
			user = User.create();
		}

		this.saveUserToLocalStore(user);

		var refsetController = this.get('controllers.refsets');		
		refsetController.getAllRefsets(1);
		
		this.stopUserInteractionEvents();
	},
	

	showRegistrationForm: function() 
	{
		return Bootstrap.ModalManager.open('registrationModal', '<img src="assets/img/login.png">  Snomed CT Registration', 'registration', this.registrationButtons, this);
	},
	
	saveUserToLocalStore : function(user)
	{
		var UtilitiesController = this.get('controllers.utilities');						
		UtilitiesController.storeDataInSessionStore('user',user);
		
		this.set('user',user);
	},
		
	actions : 
	{
		loginUser: function()
		{
			Ember.Logger.log('Performing Authentication');
			
			var _this = this;

			_this.set("loginInProgress",1);
			_this.set('loginError', null);
			
			Login.authenticate(this.username,this.password).then(function(authResult)
			{
				Ember.Logger.log("authResult",authResult);
				
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

					_this.set('password', '');			
					
					Login.isPermittedToUseRefset(loggedInUser.username).then(function(isAllowedAccessToRefset)
					{
						_this.set('loginInProgress', 0);

						switch(isAllowedAccessToRefset)
						{
							case 1:
							{
								_this.send('closeLoginModal');
								_this.set("username",loggedInUser.username);
								_this.saveUserToLocalStore(loggedInUser);
								
								var refsetsController = _this.get('controllers.refsets');
								refsetsController.getAllRefsets(1);
								
								_this.initUserInteractionEvents();

								break;
							}
							
							case 0:
							{
								_this.set('loginError', "You do not have access to this application");
								break;
							}
							
							case -1:
							{
								_this.set('loginError', "Unable to check application access: " + isAllowedAccessToRefset);
								break;
							}
						}		
					});
				}
				else
				{
					_this.set('loginInProgress', 0);
					_this.set('loginError', "Username and password not recognised");
				}
			});
		},

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
		
		closeLoginModal: function()
		{
			return Bootstrap.ModalManager.close('loginModal');
		},

		closeRegistrationModal: function()
		{
			return Bootstrap.ModalManager.close('registrationModal');
		},
		
		logout : function()
		{
			this.logout();
		},
		
		continueAsGuest : function()
		{
			var user = this.user;
			user.loginDeclined = true;

			this.saveUserToLocalStore(user);
			
			Bootstrap.ModalManager.close('loginModal');
		},
		
		resetAutoLogoutTimer : function()
		{
			Ember.Logger.log("controllers.login:resetAutoLogoutTimer");
			
			var user = this.user;
			
			user.autoLogoutTime	= new Date(new Date().getTime() + this.loginExpiryLength);
			
			this.saveUserToLocalStore(user);
		},
		
		showRegistrationForm : function()
		{
			Bootstrap.ModalManager.close('loginModal');
			this.showRegistrationForm();
		}
	}
	
});