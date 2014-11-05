import MembersAdapter 	from '../../adapters/simple-members';
var membersAdapter = MembersAdapter.create();

export default Ember.ArrayController.extend({
	
	needs : ["login"],
	
	model : [],
	
	conceptsQueue : [],
	
	processGetConceptsQueueTempData : {},
	
	importTotalChunks : 0,
	importCurrentChunk : 0,
	importProgress  : function()
	{
		var percentDone = this.importCurrentChunk / this.importTotalChunks * 100;
		
		return percentDone;
	}.property("importCurrentChunk"),
	
	
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

	showImportHelp : function()
	{
        BootstrapDialog.show({
            title: 'Member import help',
            closable: false,
            message: '...............',
            buttons: [{
                label: 'OK',
                action: function(dialog)
                {
                    dialog.close();
                }
            }]
        });		
	},
	
	toggleImportMember : function(referencedComponentId)
	{
		var members = $.extend(true, [], this.get("model"));
		
		for (var m=0;m<members.length;m++)
		{
			if (members[m].referencedComponentId === referencedComponentId)
			{
				members[m].meta.deleteConcept = !members[m].meta.deleteConcept;
				this.set("model",members);
				break;
			}
		}
	},

	toggleImportMemberActive : function(referencedComponentId)
	{
		var members = $.extend(true, [], this.get("model"));
		
		for (var m=0;m<members.length;m++)
		{
			if (members[m].referencedComponentId === referencedComponentId)
			{
				members[m].active = !members[m].active;
				this.set("model",members);
				break;
			}
		}
	},
	
	sortMembers : function(a,b)
	{
		if (a.meta.conceptActive && !b.meta.conceptActive)
			return 1;

		if (!a.meta.conceptActive && b.meta.conceptActive)
			return -1;

		if (a.description < b.description)
			return -1;
		
		if (a.description > b.description)
			return 1;
		
		return 0;		
	},
	
	processGetConceptsQueue : function(user,defaultMemberModuleId)
	{
		Ember.Logger.log("get concepts started", this.conceptsQueue.length);
		
		var _this = this;
				
		if (this.conceptsQueue.length)
		{
			var conceptsToProcess = this.conceptsQueue.shift();
			
			var promise = this.getConceptsForImportFile(user,conceptsToProcess,defaultMemberModuleId).then(function(response)
			{
				if (response.error) {_this.processGetConceptsQueueTempData.error = response.error;}

				_this.processGetConceptsQueueTempData.conceptsNotFound 	= _this.processGetConceptsQueueTempData.conceptsNotFound.concat(response.conceptsNotFound);
				_this.processGetConceptsQueueTempData.membersData 		= _this.processGetConceptsQueueTempData.membersData.concat(response.membersData);

				// Now sort member data to pull any inactive concepts to the top
				_this.processGetConceptsQueueTempData.membersData.sort(_this.sortMembers);

				_this.model.setObjects(_this.processGetConceptsQueueTempData.membersData);
			});
		}
		
		Ember.RSVP.all([promise]).then(function(response)
		{
			Ember.Logger.log("get concepts finished",_this.conceptsQueue.length);
			
			if (_this.conceptsQueue.length)
			{
				_this.processGetConceptsQueue(user,defaultMemberModuleId)
			}
			else
			{
				if (_this.processGetConceptsQueueTempData.conceptsNotFound.length)
				{
					BootstrapDialog.show({
			            title: 'Concept SCTIDs not found',
			            type : BootstrapDialog.TYPE_WARNING,
			            closable: false,
			            message: '<br><br><div class="centre">The identifiers listed below are not in SNOMED CT and cannot be imported.</div><br><br><div class="centre">' + _this.processGetConceptsQueueTempData.conceptsNotFound.toString() + '</div><br><br>',
			            buttons: [{
			                label: 'OK',
			                cssClass: 'btn-primary',
			                action: function(dialogRef){
			                    dialogRef.close();
			                }
			            }]
			        });
				}
					
				_this.set("getConceptDataInProgress",false);
				_this.set("importError",_this.processGetConceptsQueueTempData.error)}
		});
	},
	
	getConceptsForImportFile : function(user,ids,defaultMemberModuleId)
	{
		var _this = this;
		
		return membersAdapter.findList(user,ids).then(function(result)
		{
			var membersData 		= [];
			var conceptsNotFound 	= [];
			var error;
			
			_this.set("importCurrentChunk",_this.get("importCurrentChunk") + 1);
			
			if (typeof result.meta.errorInfo === "undefined")
			{
				var conceptData = result.content.concepts;
								
				membersData = ids.map(function(refCompId)
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
						member.meta.disabled				= !conceptData[refCompId].active;

						return member;
					}
					else
					{
						conceptsNotFound.push(refCompId);	
						return null;
					}
				});
										
				membersData = $.grep(membersData,function(n){ return(n); });
				
				
			}
			else
			{
				Ember.Logger.log(result.error);
				error = result.error;
			}
			
			return {error:error,membersData:membersData,conceptsNotFound:conceptsNotFound};
			
		});
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

    		this.model.setObjects([]);
    		
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

			var conceptsNotFound 	= [];
			var membersData 		= [];
			var error;
			var promises 			= [];
			var idArraySlices		= [];
			var idArrayIndex		= 0;
			
			while(idArray.length)
			{
				idArraySlices.push(idArray.splice(0,25));
			}
			
			this.conceptsQueue.setObjects(idArraySlices);
			
			this.set("importTotalChunks",idArraySlices.length +1);
			this.set("importCurrentChunk",1);
		
			this.processGetConceptsQueueTempData.conceptsNotFound = [];
			this.processGetConceptsQueueTempData.membersData = [];
			this.processGetConceptsQueueTempData.error;
			
			this.processGetConceptsQueue(user,defaultMemberModuleId);
		},
    }
});