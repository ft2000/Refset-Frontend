var User = Ember.Object.extend({
	  name:    		     null,
	  firstName:        'Guest',
	  lastName:         null,
	  token:			null,
	  permissionGroups: null,
	  logoutTimer:		0,
	  autoLogoutTime:	new Date(),
	  loginDeclined:	false
});

export default User;