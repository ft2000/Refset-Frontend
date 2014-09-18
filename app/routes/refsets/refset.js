import RefsetsAdapter 	from '../../adapters/refsets';

var refsetsAdapter = RefsetsAdapter.create();

export default Ember.Route.extend({
        		
	refset : {},
	
	model: function(params) 
	{
		Ember.Logger.log("params",params);
		
		var _this = this;
		
		var loginController = this.controllerFor('login');
		var user = loginController.user;

		var refsetController = this.controllerFor('refsets');
		var result = refsetController.getRefset(user, params.id);

		// We need to pause here foe the above promise to be fulfilled so we can check the Auth Status
		Ember.RSVP.Promise.all([result]).then(function()
		{
			if (result._result.authError)
			{
				_this.controllerFor('application').send('showLoginForm');
				Ember.Logger.log("User needs to log in to access the API for this refset...");
			}

			_this.set("refset",result._result);
		});
		
		return result;
	},
	
	actions : 
	{
		showLoginForm: function() 
		{
			Ember.Logger.log('routes.resfets.refset:actions:showLoginForm');
			this.controllerFor('application').send('showLoginForm');
		},

		updateRefset : function()
		{
			Ember.Logger.log("routes.refsets.refset:actions:updateRefset");

			var Refset = this.get("refset");

			delete Refset["formattedCreatedDate"];
			delete Refset["formattedPublishedDate"];
			delete Refset["numMembers"];
			
			for (var m=0;m<Refset.members.length;m++)
			{
				delete Refset.members[m]["conceptactive"];
				delete Refset.members[m]["found"];
				delete Refset.members[m]["description"];
			}
			
			var URLSerialisedData 	= $('#refsetEditForm').serialize();
			Ember.Logger.log("$('#refsetEditForm')",$('#refsetEditForm'));

			var utilitiesController = this.controllerFor('utilities');
			var updatedData = utilitiesController.deserialiseURLString(URLSerialisedData);
			
			for (var key in updatedData)
			{
				Refset[key] = updatedData[key];
			}
						
			Ember.Logger.log("Refset",Refset);
			
			var loginController = this.controllerFor('login');
			var user = loginController.get("user");
			
			refsetsAdapter.update(user,Refset).then(function(refset)
			{
				if (refset.meta.status === "OK")
				{
					Ember.Logger.log("Refset updated:",refset.content.id);
				}
				else
				{
					Ember.Logger.log("Refset update failed:",refset.meta.message);				
				}	
			});
		},	

		exportRefset : function()
		{
			Ember.Logger.log("routes.refsets.refset:actions:exportRefset");
		},	
	}
});