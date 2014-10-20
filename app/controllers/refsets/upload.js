import MembersAdapter 	from '../../adapters/simple-members';
var membersAdapter = MembersAdapter.create();

export default Ember.ArrayController.extend({
	
	needs : ["login"],
	
	model : [],
	
	importRequiredFilteredModel : function()
	{
		var concepts = this.get('model');
		
		Ember.Logger.log("importRequiredFilteredModel concepts");

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
	
	overrideImportList : function(newList)
	{
		this.model.setObjects(newList);
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

	addConceptsToImportList : function(membersToAddToList)
	{
		var membersToImport = [];
		
		var membersToImportOriginal = this.get("model");

		membersToImportOriginal.map(function(member)
		{
			membersToImport.push(member);
		});
		
		membersToAddToList.map(function(member)
		{
			membersToImport.push(member);
		});
		
		this.model.setObjects(membersToImport);
	},

    actions :
    {
    	importSingleMember : function(member)
    	{
    		Ember.Logger.log("controller.refstes.upload:actions:importSingleFile");
    		
    		member.moduleId = $('#newRefsetModuleId').val();
    		member.active 	= true;
    		
    		member.meta = 	{};
			member.meta.conceptActive 			= true;
			member.meta.deleteConcept 			= false;
			member.meta.found 					= true;
			member.meta.disabled				= false;
						
			this.addConceptsToImportList([member]);
    	},
    	
    	
		importFlatFile : function(members)
		{
    		Ember.Logger.log("controller.refstes.upload:actions:importFlatFile");

    		var _this = this;
			
			members = members.replace(/\r?\n|\r/g,"\n");
			
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

			var conceptsNotFound = []; 
			
	//		while(idArray.length)
	//		idArray.splice(0,10)
			{			
				membersAdapter.findList(user,idArray).then(function(result)
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
								member.description					= conceptData[refCompId].label;
								member.meta.conceptActive 			= conceptData[refCompId].active;
								member.meta.deleteConcept 			= !conceptData[refCompId].active;
								member.meta.found 					= true;
								member.meta.disabled				= !conceptData[refCompId].active;
	
								return member;
							}
							else
							{
								conceptsNotFound.push(refCompId);
								
								return null;
							}
						});
						
						membersData2 = $.grep(membersData2,function(n){ return(n); });
						
						if (conceptsNotFound.length)
						{
							BootstrapDialog.show({
					            title: '<img src="assets/img/login.white.png"> Concept SCTIDs not found',
					            type : BootstrapDialog.TYPE_WARNING,
					            closable: false,
					            message: '<br><br><div class="centre">We have failed to find the following concept SCTIDs in our database.<br>They cannot, therefore, be imported.</div><br><br><div class="centre">' + conceptsNotFound.toString() + '</div><br><br>',
					            buttons: [{
					                label: 'OK',
					                cssClass: 'btn-primary',
					                action: function(dialogRef){
					                    dialogRef.close();
					                }
					            }]
					        });
						}
						
						_this.set("importError",null);
						_this.model.setObjects(membersData2);
					}
					else
					{
						Ember.Logger.log(result.error);
						_this.set("importError",result.error);
					}
	
					_this.set("getConceptDataInProgress",false);
				});
			}
		},

    }
});