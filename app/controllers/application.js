import User from '../models/user';
import Login from '../models/login';

export default Ember.Controller.extend({
	user : null,
	loginInProgress : false,
	loginError: null,
	username : '',
	password: '',
 
	loginButtons: [
	    Ember.Object.create({title: 'Cancel', clicked: 'closeLoginModal'}),
		Ember.Object.create({title: 'Login', clicked:'loginUser'})
	],

	registrationButtons: [
		Ember.Object.create({title: 'Cancel', clicked: 'closeRegistrationModal'}),
		Ember.Object.create({title: 'Register', clicked:'registerUser'})
	],

	actions: 
	{
		showLoginForm: function() 
		{
			return Bootstrap.ModalManager.open('loginModal', '<img src="assets/img/login.png"> Snomed CT Login', 'login', this.loginButtons, this);
		},

		loginUser: function()
		{
			Ember.Logger.log('Performing Authentication');
			
			var _this = this;
			_this.set("loginInProgress",1);
			_this.set('loginError', null);
			
			Login.authenticate(this.get('username'), this.get('password')).then(function(authResult)
			{
				Ember.Logger.log("authenticate",authResult.user.givenName);

				var user = User.create({
					firstName: authResult.user.givenName,
					lastName: authResult.user.surname,
					name: authResult.user.name,
					token: authResult.user.token,
					permissionGroups: Ember.A()
				});
	
				Ember.Logger.log("User logged in",JSON.stringify(user));
				
				Login.isPermittedToUseRefset(user.get('name')).then(function(isAllowedAccessToRefset)
				{
					Ember.Logger.log("isPermittedToUseRefset : ",isAllowedAccessToRefset);
					
					_this.set('loginInProgress', 0);
					
					switch(isAllowedAccessToRefset)
					{
						case 1:
						{
							_this.set('user', user);
							_this.send('closeLoginModal');
							
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
				var permissionGroups = Login.getPermissionGroups(user.get('name')).then(function(permResult)
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
			this.set('user', null);
		}
	}

});