var User = Ember.Object.extend({
	  username:         null,
	  firstName:        'Guest',
	  lastName:         null,
	  token:			null,
	  permissionGroups: null,
	  logoutTimer:		0
});

export default User;