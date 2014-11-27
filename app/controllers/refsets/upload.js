import MembersAdapter 	from '../../adapters/simple-members';
var membersAdapter = MembersAdapter.create();

export default Ember.ArrayController.extend({
	
	needs : ["login"],
	
	model : [], // flat file import
	
	isRF2Import	: false,
	rf2file : null,
	
	conceptsQueue : [],
	
	moreThanOneRefsetInRF2 	: false,
	rf2FileToImport 		: {id:"0",label:"loading...x"},
	
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
		if (a.meta.conceptActive && !b.meta.conceptActive) {return 1;}
		if (!a.meta.conceptActive && b.meta.conceptActive) {return -1;}
		if (a.description < b.description) {return -1;}		
		if (a.description > b.description) {return 1;}
		
		return 0;		
	},
	
	processGetConceptsQueue : function(user,defaultMemberModuleId)
	{
		Ember.Logger.log("get concepts started", this.conceptsQueue.length);
		
		var promise;
		var _this = this;
				
		if (this.conceptsQueue.length)
		{
			var conceptsToProcess = this.conceptsQueue.shift();
			
			promise = this.getConceptsForImportFile(user,conceptsToProcess,defaultMemberModuleId).then(function(response)
			{
				if (response.error) {_this.processGetConceptsQueueTempData.error = response.error;}

				_this.processGetConceptsQueueTempData.conceptsNotFound 	= _this.processGetConceptsQueueTempData.conceptsNotFound.concat(response.conceptsNotFound);
				_this.processGetConceptsQueueTempData.membersData 		= _this.processGetConceptsQueueTempData.membersData.concat(response.membersData);

				// Now sort member data to pull any inactive concepts to the top
				_this.processGetConceptsQueueTempData.membersData.sort(_this.sortMembers);

				_this.model.setObjects(_this.processGetConceptsQueueTempData.membersData);
			});
		}
		
		Ember.RSVP.all([promise]).then(function()
		{
			Ember.Logger.log("get concepts finished",_this.conceptsQueue.length);
			
			if (_this.conceptsQueue.length)
			{
				_this.processGetConceptsQueue(user,defaultMemberModuleId);
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
				_this.set("importError",_this.processGetConceptsQueueTempData.error);}
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
    		Ember.Logger.log("controller.refsets.upload:actions:importSingleFile");
    		
    		member.moduleId = $('#newRefsetModuleId').val();
    		member.active 	= true;
    		
    		member.meta = 	{};
			member.meta.conceptActive 			= true;
			member.meta.deleteConcept 			= false;
			member.meta.found 					= true;
			member.meta.disabled				= false;
						
			this.addConceptsToImportList([member]);
    	},
    	
    	
		importRF2File : function(members)
		{
    		Ember.Logger.log("controller.refsets.upload:actions:importRF2File");
    		    		
    		this.model.setObjects([]);
    		this.set("isRF2Import",true);
    		this.set("rf2file",members);
    		var _this = this;
    		
			var loginController = this.get('controllers.login');
			var user = loginController.user;
			
			Ember.run.next(this, function()
    	    {	
	    		// Process file to remove any blank lines or trailing CR/LF 
	    		var rawArray = members.split('\n');
	    		
	    		rawArray.shift(); // Remove the header row at the top
	    		
	    		var refsetsInRF2File = {};
	    		var promises = [];
	    		
				var rowsToImportArray = rawArray.map(function(member)
				{
					if (typeof member !== "undefined" && member !== "")
					{
						var memberRow 		= member.split(/\t/);
						var effectiveTime	= memberRow[1];
						var refsetId 		= memberRow[4];
						var conceptId 		= memberRow[5];

						if (effectiveTime === "") // If no effective Time, then not published, so ignore it
							return null;
						
						// We may have more than one refset in an RF2 file, so lets deal with them separately.
						if (!(refsetId in refsetsInRF2File))
						{
							refsetsInRF2File[refsetId] = {id:refsetId,label:'loading...',concepts:{}}
								
							var promise = membersAdapter.find(user,refsetId).then(function(response)
							{
								return {id:refsetId,label:response.content.concept.label};	
							});
							
							promises.push(promise);
						}
						
						refsetsInRF2File[refsetId].concepts[conceptId] = 1;						
						
						return member;
					}
				});
				
				rowsToImportArray = $.grep(rowsToImportArray,function(n){ return(n); });

				// count how many rows are in the RF2 file - a member might well be in the file more than one in different states, so num rows != num members...
				var numRowsToImport 	= rowsToImportArray.length;
				
				var refsetsArray		= Object.keys(refsetsInRF2File);
				
				var refsets 			= [];
				
				for (var r=0;r<refsetsArray.length;r++)
				{
					refsets[r] = refsetsInRF2File[refsetsArray[r]];
					
					var conceptsArray		= Object.keys(refsets[r].concepts);
					
					var concepts 			= [];
					
					for (var c=0;c<conceptsArray.length;c++)
					{
						concepts[c] = refsets[r].concepts[conceptsArray[c]];
					}
					
					refsets[r].concepts = concepts;
				}
				
				_this.set("moreThanOneRefsetInRF2",refsets.length>1);
				
				Ember.RSVP.all(promises).then(function(result)
				{
					for (var l=0;l<result.length;l++)
					{
						for (var r=0;r<refsets.length;r++)
						{
							if (refsets[r].id === result[l].id)
							{
								refsets[r].label = result[l].label;
							}
						}
					}

					if (refsets.length > 0)
					{
						_this.set("rf2FileToImport",refsets[0]);
					}
					else
					{
						_this.set("rf2FileToImport",{});
					}

					_this.model.setObjects(refsets);
				});
				
				_this.model.setObjects(refsets);
    	    });
		},
    	
		importFlatFile : function(members)
		{
    		Ember.Logger.log("controller.refsets.upload:actions:importFlatFile");
    		
    		this.model.setObjects([]);
    		this.set("isRF2Import",false);
    		var _this = this;
    		
    		Ember.run.next(this, function()
    		{					
				var membersArray = members.split('\n');
				
				var idArray = membersArray.map(function(refCompId)
				{
					if (typeof refCompId !== "undefined" && refCompId !== "")
					{
						return refCompId;
					}
				});
				
				idArray = $.grep(idArray,function(n){ return(n); });
	
				var loginController = this.get('controllers.login');
				var user = loginController.user;
				
				_this.set("getConceptDataInProgress",true);
				
				var defaultMemberModuleId = $('#newRefsetModuleId').val();
				
				var idArraySlices		= [];			
				while(idArray.length)
				{
					idArraySlices.push(idArray.splice(0,25));
				}
				
				_this.conceptsQueue.setObjects(idArraySlices);
				
				_this.set("importTotalChunks",idArraySlices.length +1);
				_this.set("importCurrentChunk",1);
			
				_this.processGetConceptsQueueTempData.conceptsNotFound	= [];
				_this.processGetConceptsQueueTempData.membersData 		= [];
				_this.processGetConceptsQueueTempData.error 			= 0;
				
				_this.processGetConceptsQueue(user,defaultMemberModuleId);
    		});
		},
    }
});