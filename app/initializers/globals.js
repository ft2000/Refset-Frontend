import User from '../models/user';

var globals = Ember.Object.extend({
	user : User.create()
});

export default 
{
	name: "globals",

	initialize: function(container, application) 
	{
		application.register('global:variables', globals, {singleton: true});
		application.inject('controller', 'globals', 'global:variables');
		application.inject('route', 'globals', 'global:variables');

		Ember.Logger.log("initialize",container,application);
	}
};