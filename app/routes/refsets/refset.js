import RefsetsAdapter 	from '../../adapters/refsets';
var refsetsAdapter = RefsetsAdapter.create();

export default Ember.Route.extend({
        		
	beforeModel : function(params)
	{
		var _this 	= this;
		var id 		= params.params["refsets.refset"].id;
		
		Ember.Logger.log("routes.refsets.refset:beforeModel (id)",id);
		
		// Run next so that we do not prevent the UI being dislayed if the data is delayed...
		return Ember.run.next(function(){_this.controllerFor('data').getRefset(id);});
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
			
			var MembersToDelete = [];
			$(".checkboxList input[name=deleteConcept]:checked").each(function ()
			{
				MembersToDelete.push(parseInt($(this).val()));
			});			
			
			for (var m=Refset.members.length-1;m>=0;m--)
			{
				if ($.inArray(Refset.members[m].referenceComponentId,MembersToDelete))
				{
					Refset.members.splice(m,1);
				}
			}
			Ember.Logger.log("finished checking",Refset.members.length);
			
			var ActiveMembers = [];
			$(".checkboxList input[name=conceptId]:checked").each(function ()
			{
				ActiveMembers.push(parseInt($(this).val()));
			});			
			Ember.Logger.log("ActiveMembers",ActiveMembers);

			for (m=0;m<Refset.members.length;m++)
			{
				delete Refset.members[m]["conceptactive"];
				delete Refset.members[m]["found"];
				delete Refset.members[m]["description"];

				Refset.members[m].active = (ActiveMembers.indexOf(Refset.members[m].referenceComponentId) !== -1);
			}
			
			var URLSerialisedData 	= $('#refsetEditForm').serialize();
			Ember.Logger.log("$('#refsetEditForm')",$('#refsetEditForm'));

			var utilitiesController = this.controllerFor('utilities');
			var updatedData = utilitiesController.deserialiseURLString(URLSerialisedData);
			
			for (var key in updatedData)
			{
				Refset[key] = updatedData[key];
			}
						
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

		exportRefset : function(id)
		{
			Ember.Logger.log("routes.refsets.refset:actions:exportRefset (id)",id);
			
			var loginController = this.controllerFor('login');
			var user = loginController.user;
			
			refsetsAdapter.getRefsetExport(user, id).then(function(exportFile)
			{
				var blob = new Blob([exportFile], {type: "text/plain;charset=utf-8"});
				saveAs(blob, id + ".rf2");
			});
			
		},	
		
		deleteRefset : function(id)
		{
			Ember.Logger.log("routes.refsets.refset:actions:deleteRefset (id)",id);
			
			var loginController = this.controllerFor('login');
			var user = loginController.user;
			
			var _this = this;
			
			refsetsAdapter.deleteRefset(user, id).then(function()
			{
				var refsetController = _this.controllerFor('refsets');
				refsetController.getAllRefsets(1);
				
				_this.transitionTo('refsets');
			});
			
		},	
	}
});