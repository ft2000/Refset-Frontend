import MembersAdapter 	from '../../adapters/simple-members';

var membersAdapter = MembersAdapter.create();

export default Ember.ArrayController.extend({
	
	needs : ["login"],
	
	model : [],
	
	importRequiredFilteredModel : function()
	{
		var concepts = this.get('model');
		
		Ember.Logger.log("importRequiredFilteredModel concepts",concepts)

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
			return concept.meta.deleteConcept ? null : concept;
		});
		
		conceptsToImport = $.grep(conceptsToImport,function(n){ return(n) });
		
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

			var membersData = membersAdapter.findList(user,idArray).then(function(result)
			{
				Ember.Logger.log("result",result);

				var membersData2;
				
				if (typeof result.meta.errorInfo === "undefined")
				{
					var conceptData = result.content.concepts;
					
					membersData2 = idArray.map(function(refCompId)
					{
						if (conceptData[refCompId] !== null)
						{
							return {referenceComponentId:refCompId, active:true, meta : {conceptActive:conceptData[refCompId].active, conceptEffectiveTime : conceptData[refCompId].effectiveTime, moduleId:conceptData[refCompId].module, description: conceptData[refCompId].label,found:true, disabled:!conceptData[refCompId].active}};
						}
						else
						{
							return {referenceComponentId:refCompId, active:false, meta : {conceptActive:false, conceptEffectiveTime:conceptData[refCompId].effectiveTime, moduleId:conceptData[refCompId].module, description: 'concept not found',found:false, disabled:true}};
						}
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
			
			Ember.Logger.log("controllers.refsets.upload:actions:uploadMemberList (membersData)",membersData);			
		},

    }
});