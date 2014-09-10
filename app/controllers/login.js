import Login 	from '../models/login';
import User		from '../models/user';

export default Ember.ObjectController.extend({

	loginInProgress 	: false,
	loginError			: null,
	username 			: 'ianbale',
	password			: '',
	user				: User.create(),
	needs 				: ["refsets","utilities"],
	
	loginButtons: 
	[
   	    Ember.Object.create({title: 'Cancel', clicked: 'closeLoginModal'}),
   		Ember.Object.create({title: 'Login', clicked:'loginUser'})
   	],

   	registrationButtons: 
   	[
   		Ember.Object.create({title: 'Cancel', clicked: 'closeRegistrationModal'}),
   		Ember.Object.create({title: 'Register', clicked:'registerUser'})
   	],

	showLoginForm: function() 
	{
		Ember.Logger.log('showLoginForm');
		
		return Bootstrap.ModalManager.open('loginModal', '<img src="assets/img/login.png"> Snomed CT Login', 'login', this.loginButtons, this);
	},

	loginUser: function()
	{
		Ember.Logger.log('Performing Authentication');
		
		var _this = this;

		_this.set("loginInProgress",1);
		_this.set('loginError', null);
		
if (1)
{
	var loggedInUser = User.create({
		username: 'ianbale',
		firstName: 'Ian',
		lastName: 'Bale',
		token: 'my token',
		permissionGroups: Ember.A(),
		loggedIn : true
	});

	_this.set('user',loggedInUser);
	_this.send('closeLoginModal');			
	
	var controller = _this.get('controllers.utilities');
	
	controller.storeDataInSessionStore('user',loggedInUser);
}
		
else

		Login.authenticate(this.username,this.password).then(function(authResult)
		{
			Ember.Logger.log("authResult",authResult);
			
			var loggedInUser = User.create({
				username: authResult.user.name,
				firstName: authResult.user.givenName,
				lastName: authResult.user.surname,
				token: authResult.user.token,
				permissionGroups: Ember.A(),
				loggedIn : true
			});

			Ember.Logger.log("User logged in",JSON.stringify(loggedInUser));
			
			Login.isPermittedToUseRefset(loggedInUser.username).then(function(isAllowedAccessToRefset)
			{
				_this.set('loginInProgress', 0);

				switch(isAllowedAccessToRefset)
				{
					case 1:
					{
						_this.set('globals.user',loggedInUser);
						_this.set('user',loggedInUser);
						_this.send('closeLoginModal');

						var controller = _this.get('controllers.refsets');
						controller.getAllRefsets(1);

						break;
					}
					
					case 0:
					{
						_this.set('loginError', "You do not have access to this application");
						break;
					}
					
					default:
					{
						_this.set('loginError', "Unable to check application access: " + isAllowedAccessToRefset);
						break;
					}
				}
					
			},

			function(error)
			{
				Ember.Logger.log('isPermittedToUseRefset error:' + error);
				
				_this.set('loginInProgress', 0);
				_this.set('loginError', "Unable to check application access: " + error.errorMessage);
			});
			
			/*					
				var permissionGroups = Login.getPermissionGroups(user.get('username')).then(function(permResult)
				{
					Ember.Logger.log('success roles:' + permResult);
	
				for (var i = 0; i < success.perms.length; i++)
					{
						User.get('permissionGroups').pushObject(
							PermissionGroup.create({
								app:     success.perms[i].app,
								role:    success.perms[i].role,
								country: success.perms[i].member
							})
						);
					}
				},


				
				function(error)
				{
					Ember.Logger.log('permissionGroups error:' + error);
					
					_this.set('loginInProgress', 0);
					_this.set('loginError', "Unable to load permissions: " + error.errorMessage);
				});
*/			
		},
		
		function(error)
		{
			Ember.Logger.log('error',error);
			
			_this.set('loginInProgress', 0);
			_this.set('loginError', "Username and password not recognised");
		});
	},

	showRegistrationForm: function() 
	{
		return Bootstrap.ModalManager.open('registrationModal', '<img src="assets/img/login.png">  Snomed CT Registration', 'registration', this.registrationButtons, this);
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
		var guestUser = User.create();
		this.set('user',guestUser);

		var utilitiesController = this.get('controllers.utilities');
		utilitiesController.storeDataInSessionStore('user',guestUser);

		var refsetController = this.get('controllers.refsets');		
		refsetController.getAllRefsets(1);
	},
	
	loginFromLocalStore : function()
	{
		var controller 	= this.get('controllers.utilities');
		var userData 	= controller.getDataFromSessionStore('user');
		
		Ember.Logger.log("controller.login:loginFromLocalStore (userData)",userData);
		
		if (userData.status === 'ok')
		{
			this.set('user',userData.data);
		}
	},
	
});