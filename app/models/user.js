var User = Ember.Object.extend({
	  username:         null,
	  firstName:        'Guest',
	  lastName:         null,
	  token:			null,
	  permissionGroups: null,
	  logoutTimer:		0,
	  autoLogoutTime:	new Date(),
	  loginDeclined:	false
});

export default User;