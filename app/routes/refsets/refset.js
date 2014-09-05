import RefsetsController from '../../controllers/refsets';

var refController = RefsetsController.create();

export default Ember.Route.extend({
           
	model: function(params) 
	{
		var _this = this;
		
		// Why is globals unavailable in the controller????
		var user = this.get('globals.user');
		
		var result = refController.getRefset(user, params.id);
		
		Ember.RSVP.Promise.all([result]).then(function()
		{
			Ember.Logger.log("promise done",result,result._result.authError);

			if (result._result.authError)
			{
			//	_this.sendAction('showLoginForm');
				_this.controllerFor('application').send('showLoginForm');
				Ember.Logger.log("User needs to log in to access the API for this refset...");
			}
		});
		
		
		return result;
	},
	
	actions : 
	{
		showLoginForm: function() 
		{
			Ember.Logger.log('resfets:refset:showLoginForm');
			this.controllerFor('application').send('showLoginForm');
		},
	}
});