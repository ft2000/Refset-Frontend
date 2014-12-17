import RefsetModel from '../../models/refset';

export default Ember.ObjectController.extend({
		
	needs : ["login","utilities","refsets/upload","data"],

	potentialMembersToImport	: Ember.computed.alias("controllers.refsets/upload.model"),
	getConceptDataInProgress 	: Ember.computed.alias("controllers.refsets/upload.getConceptDataInProgress"),
	importError 				: Ember.computed.alias("controllers.refsets/upload.importError"),
	moduleTypesArray			: Ember.computed.alias("controllers.data.moduleTypesArray"),
	importProgress				: Ember.computed.alias("controllers.refsets/upload.importProgress"),
	isRF2Import					: Ember.computed.alias("controllers.refsets/upload.isRF2Import"),

	dialogInstance 				: null,
	
	rf2FileToImport				: Ember.computed.alias("controllers.refsets/upload.rf2FileToImport"),
	moreThanOneRefsetInRF2		: Ember.computed.alias("controllers.refsets/upload.moreThanOneRefsetInRF2"),
	
	filterByInactiveConcepts	: -1,
	filterByDescription			: '',
	
	filterByInactiveConceptsIsActive	: function(){ return this.filterByInactiveConcepts !== -1;}.property('filterByInactiveConcepts'),
	
	sortBy 								: 'description',
	sortOrder							: 'asc',

	filteringActive						: function()
	{ 
		if (this.get("filterByDescription") !== "") { return true; }
		if (this.get("filterByInactiveConceptsIsActive")) { return true; }
		
	}.property('potentialMembersToImport.@each','sortBy','sortOrder','filterByInactiveConcepts','filterByDescription'),

	filteredImportMembers				: function()
	{
		var allMembers = this.get('potentialMembersToImport');
		
		return this.filterMembers(allMembers);
		
	}.property('potentialMembersToImport.@each','sortBy','sortOrder','filterByInactiveConcepts','filterByDescription'),

	clearAllFilters : function()
	{
		this.set("filterByInactiveConcepts",-1);
		this.set("filterByDescription","");
	},
	
	filterMembers : function(allMembers)
	{
		if (typeof allMembers !== "undefined")
		{
			var filterByInactiveConcepts 	= this.get("filterByInactiveConcepts");
			var filterByDescription 		= this.get("filterByDescription");
			
			var filteredMembers = allMembers.map(function(member)
			{
				if (typeof member !== "undefined")
				{
					var score;
					
					if (filterByDescription !== '')
					{
						if (filterByDescription.match(/^[0-9]*$/))
						{
							var regExp = new RegExp(filterByDescription,"g");
							score = member.referencedComponentId.search(regExp);
							
							if (score === -1)
							{
								return null;
							}
							else
							{
								member.meta.score = 100 - score;
							}
						}
						else
						{
							score = LiquidMetal.score(member.description, filterByDescription);

							if (score < 0.75)
							{
								return null;								
							}
							else
							{
								member.meta.score = score;
							}
						}
					}
					
					return member;	
				}
 
			});

			var nullsRemoved = $.grep(filteredMembers,function(n){ return(n); });			
			var sortBy 		= this.get("sortBy");
			var sortOrder 	= this.get("sortOrder");
			
			if (filterByDescription !== '' && sortOrder === "score" && (sortBy === "description" || sortBy === "referencedComponentId"))
			{
				quick_sort(nullsRemoved);
			}
			else
			{
				nullsRemoved = mergesort(nullsRemoved,sortBy,sortOrder);
			}
			
			return nullsRemoved;
		}	
	},
	
	createEmptyRefset : function()
	{
		var model = RefsetModel.create();
		
		
		Ember.Logger.log("xxxxxxxxxxxxxxxxxxxxxxxxxx createEmptyRefset",model);

		model.meta.expectedReleaseDateInput = null;
		this.set("model",model);
		
		this.clearAllFilters();
		
		var uploadController = this.get('controllers.refsets/upload');		
		uploadController.clearMemberList();

		var dataController = this.get('controllers.data');		
		dataController.clearRefset();
	
		Ember.run.scheduleOnce('afterRender', this, function(){
			document.getElementById('refsetUploadFileInput').addEventListener('change', readSingleFile, false);
			document.getElementById('fileUploadDropZone').addEventListener('dragover', handleDragOver, false);
			document.getElementById('fileUploadDropZone').addEventListener('dragenter', handleDragEnter, false);
			document.getElementById('fileUploadDropZone').addEventListener('dragleave', handleDragLeave, false);
			document.getElementById('fileUploadDropZone').addEventListener('drop', readSingleFile, false);
		});
	},
	
	create : function()
	{
		Ember.Logger.log("controllers.refsets.new:create");
		
		var parselyForm = $('#refset-header').parsley(
		{validators:
			{
				descriptioninuse: 
				{
					fn: function (value) 
					{
						console.log("+++++++++++++++++++++++ ParsleyConfig",value);  	
						return false;
					},
					priority: 32
				}
			}
		});

		if (parselyForm.validate())
		{
			var isRF2Import = this.get("isRF2Import");		
			if (isRF2Import)
			{
				var rf2 = this.get("rf2FileToImport");
				this.set("model.sctId",rf2.sctId);
				this.set("model.description",rf2.label);
			}
	
			var Refset = {};
			
			Refset.typeId 				= this.get("model.typeId");
			Refset.componentTypeId 		= this.get("model.componentTypeId");
			Refset.moduleId 			= this.get("model.moduleId");
			Refset.active 				= true; // Always make new refsets active
			Refset.languageCode 		= this.get("model.languageCode");
			Refset.description 			= this.get("model.description");
			Refset.published 			= false;
			
			var releaseDate 			= this.get("model.meta.expectedReleaseDateInput");
			Refset.expectedReleaseDate 	= releaseDate;
	
			if (isRF2Import)
			{
				Refset.sctId 			= this.get("model.sctId");
				Refset.published 		= this.get("model.published");
			}
			
			// Need to validate the form at this point and abort if required fields are not completed
					
			this.dialogInstance = BootstrapDialog.show({
	            title: 'Creating your Refsetence Set',
	            closable: false,
	            message: '<br><br><div class="centre">We are creating your Reference Set Header. Please wait...<br><br><img src="assets/img/googleballs-animated.gif"></div><br><br>',
	            buttons: [{
	                label: 'OK',
	                cssClass: 'btn-primary',
	                action: function(dialogRef){
	                    dialogRef.close();
	                }
	            }]
	        });
			this.dialogInstance.getModalFooter().hide();
	
			var dataController = this.get('controllers.data');		
			dataController.createRefset(Refset,this,'createRefsetComplete');
		}

	},
 
    actions :
    {
    	createRefsetComplete : function(response)
    	{
    		Ember.Logger.log("controller.refsets.new:actions:createRefsetComplete",response);

    		if (response.error)
    		{
    			var message = '<table class="centre"><tr><td><img src="assets/img/warning.jpg"></td><td style="vertical-align:middle"><h2>Refset creation failed.</h2></td></tr></table>';

   				message += '<br><br><p class="centre">' + response.message+'</p>';

   				this.dialogInstance.setMessage(message);
    			this.dialogInstance.setType(BootstrapDialog.TYPE_WARNING);
    			this.dialogInstance.getModalFooter().show();
    		}
    		else
    		{
    			var refsetId = response.uuid;

    			this.transitionToRoute('refsets.refset',refsetId);
    			
    			var conceptsToImport;
    			var isRF2Import 		= this.get("isRF2Import");
    			var dataController 		= this.get('controllers.data');	
    			var uploadController 	= this.get('controllers.refsets/upload');	

    			if (isRF2Import) // Importing an RF2 file
    			{
    				conceptsToImport = uploadController.get("rf2file");
    			}
    			else
        		{
    				conceptsToImport = uploadController.getMembersMarkedForImport();
        		}	

    			if (conceptsToImport.length)
    			{
    				if (isRF2Import) // Importing an RF2 file
    				{
            			this.dialogInstance.setMessage('<br><br><div class="centre">Your Reference Set Header has been created.<br><br><div class="centre">We are now importing members from your RF2 file. Please wait...<br><br><img src="assets/img/googleballs-animated.gif"></div><br><br>');
    					
            			// Now initiate sending RF2 file to the API.
            			dataController.importRF2(refsetId,conceptsToImport,this,'importRF2Complete');	
    				}
    				else // Flat file of concepts IDs to import
    				{
            			this.dialogInstance.setMessage('<br><br><div class="centre">Your Reference Set Header has been created.<br><br><div class="centre">We are now importing members. Please wait...<br><br><img src="assets/img/googleballs-animated.gif"></div><br><br>');
                		
            			// Now initiate adding members to our new refset...
            			dataController.addMembers(refsetId,conceptsToImport,this,'addMembersComplete');	
    				}
    			}
    			else
    			{
        			this.dialogInstance.setMessage('<br><br><div class="centre">Refset created.<br><br>');
    				this.dialogInstance.getModalFooter().show();
    			}
    		}
    	},

    	importRF2Complete : function()
    	{
			this.dialogInstance.setMessage('<br><br><div class="centre">Your Reference Set Header has been created.<br><br><div class="centre">RF2 file imported.<br><br>');
			this.dialogInstance.getModalFooter().show();
    	},
    	
    	addMembersComplete : function(response)
    	{
    		Ember.Logger.log("controller.refsets.new:actions:addMembersComplete",response);
	
    		if (response.error)
    		{
    			var message = '<table class="centre"><tr><td><img src="assets/img/warning.jpg"></td><td style="vertical-align:middle"><h2>Importing members failed.</h2></td></tr></table>';

    			if (typeof response.unauthorised !== "undefined")
    			{
    				message += '<br><br><p class="centre">You are not authorised to add members. You may need to log in.</p>';
    			}

    			if (typeof response.commsError !== "undefined")
    			{
    				message += '<br><br><p class="centre">We cannot communicate with the Refset API at this time. Retry later.</p>';
    			}

    			if (typeof response.requestError !== "undefined")
    			{
    				message += '<br><br><p class="centre">The API rejected our request.</p>';
    			}

    			this.dialogInstance.setMessage(message);
    			this.dialogInstance.setType(BootstrapDialog.TYPE_WARNING);
    			this.dialogInstance.getModalFooter().show();
    		}
    		else
			{
    			this.dialogInstance.setMessage('<br><br><div class="centre">Your Reference Set Header has been created.<br><br><div class="centre">Members imported.<br><br>');
    			this.dialogInstance.getModalFooter().show();
			}
    	},
    	
    	togglePublishedRefsetImportForm : function()
    	{
    		Ember.Logger.log("togglePublishedRefsetImportForm",this.doImportPublishedRefset);
    		this.set("doImportPublishedRefset",$('#import').is(':checked'));
    	},

		toggleMembersImportForm : function()
		{
			Ember.Logger.log("togglePublishedRefsetImportForm",this.doImportPublishedRefset);
			this.set("doImportMembers",$('#import-members').is(':checked'));

			if (this.doImportMembers)
			{
				Ember.run.next(this,function()
				{
					Ember.Logger.log("controllers.refsets.new:actions:toggleMembersImportForm (Setting event listeners)");
					
					document.getElementById('refsetUploadFileInput').addEventListener('change', readSingleFile, false);
					document.getElementById('fileUploadDropZone').addEventListener('dragover', handleDragOver, false);
					document.getElementById('fileUploadDropZone').addEventListener('drop', readSingleFile, false);
				});
			}
			else
			{
				Ember.Logger.log("controllers.refsets.new:actions:toggleMembersImportForm (Clearing members)");

				var uploadController = this.get('controllers.refsets/upload');
				uploadController.clearMemberList();
			}
		},
		
		clearForm : function()
		{
			this.createEmptyRefset();
			this.set("isRF2Import",false);
			this.set("rf2FileToImport.sctId","0");
			this.set("rf2FileToImport.label","loading...");
		},
		
		clearImportList : function()
		{
			var uploadController = this.get('controllers.refsets/upload');		
			uploadController.clearMemberList();	
		},
		
		showImportHelp : function()
		{
			var uploadController = this.get('controllers.refsets/upload');	
			uploadController.showImportHelp();		
		},

		toggleImportMember : function(referencedComponentId)
		{
			var uploadController = this.get('controllers.refsets/upload');	
			uploadController.toggleImportMember(referencedComponentId);	
		},

		toggleImportMemberActive : function(referencedComponentId)
		{
			var uploadController = this.get('controllers.refsets/upload');	
			uploadController.toggleImportMemberActive(referencedComponentId);	
		},
		
		saveMemberModuleId : function(memberWrapper)
		{
			var member = memberWrapper.content;
			var newModuleId = $('#member-module-id-' + member.referencedComponentId).val();
			member.moduleId = newModuleId;
		}
    }
});