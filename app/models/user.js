var User = Ember.Object.extend({
	  username:         null,
	  firstName:        'Guest',
	  lastName:         null,
	  token:			null,
	  permissionGroups: null,
	  loggedIn:	 		false
});

export default User;