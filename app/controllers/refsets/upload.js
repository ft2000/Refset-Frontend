import MembersAdapter 	from '../../adapters/simple-members';
var membersAdapter = MembersAdapter.create();

export default Ember.ArrayController.extend({
	
	needs : ["login"],
	
	model : [],
	
	importRequiredFilteredModel : function()
	{
		var concepts = this.get('model');
		
		Ember.Logger.log("importRequiredFilteredModel concepts",concepts);

		return concepts.filter(function(concept)
		{
			return !concept.meta.deleteConcept;
		});
	}.property('model'),
	
    importError : null,

	clearMemberList : function()
	{
		this.model.setObjects([]);
	},
	
	getConceptDataInProgress : false,

	clearMembers : function()
	{
		this.model.setObjects([]);
	},
	
	getMembersMarkedForImport : function()
	{
		var concepts = this.get('model');
		
		var conceptsToImport =  concepts.map(function(concept)
		{
			var validConcept = $.extend(true, {}, concept);
			
			delete validConcept["meta"];
			
			return concept.meta.deleteConcept ? null : validConcept;
		});
		
		conceptsToImport = $.grep(conceptsToImport,function(n){ return(n); });
		
		return conceptsToImport;
	},
	
    actions :
    {
		importFlatFile : function(members)
		{
			var _this = this;
			var membersArray = members.split('\n');
			
			var idArray = membersArray.map(function(refCompId)
			{
				if (refCompId !== "")
				{
					return refCompId;
				}
			});
			
			idArray = $.grep(idArray,function(n){ return(n); });

			var loginController = this.get('controllers.login');
			var user = loginController.user;
			
			this.set("getConceptDataInProgress",true);

			var defaultMemberModuleId = $('#newRefsetModuleId').val();
			
			var membersData = membersAdapter.findList(user,idArray).then(function(result)
			{
				var membersData2;
				
				if (typeof result.meta.errorInfo === "undefined")
				{
					var conceptData = result.content.concepts;
					
					membersData2 = idArray.map(function(refCompId)
					{
						var member = {};
						
						member.referencedComponentId = refCompId;
						member.moduleId = defaultMemberModuleId;
						member.meta = {};
						
						if (conceptData[refCompId] !== null)
						{
							member.active 						= true;
							member.meta.conceptActive 			= conceptData[refCompId].active;
							member.meta.conceptEffectiveTime 	= conceptData[refCompId].effectiveTime;
							member.meta.conceptModuleId 		= conceptData[refCompId].moduleId;
							member.meta.description				= conceptData[refCompId].label;
							member.meta.found 					= true;
							member.meta.disabled				= !conceptData[refCompId].active;
						}
						else
						{
							member.active 						= false;
							member.meta.conceptActive 			= false;
							member.meta.description				= 'concept not found';
							member.meta.found 					= false;
							member.meta.disabled				= true;
						}
						
						return member;
					});	

					_this.set("importError",null);
					_this.model.setObjects(membersData2);
				}
				else
				{
					Ember.Logger.log(result.error);
					_this.set("importError",result.error);
				}

				_this.set("getConceptDataInProgress",false);
				return membersData2;
			});
		},

    }
});