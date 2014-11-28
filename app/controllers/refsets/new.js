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
	disablePublishedFormFields	: true,
	
	rf2FileToImport				: Ember.computed.alias("controllers.refsets/upload.rf2FileToImport"),
	moreThanOneRefsetInRF2		: Ember.computed.alias("controllers.refsets/upload.moreThanOneRefsetInRF2"),
	
	createEmptyRefset : function()
	{
		this.set("model",RefsetModel.create());
		this.set("model.meta.expectedReleaseDateInput",null);
		this.set("disablePublishedFormFields",true);
		
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
		
		var isRF2Import = this.get("isRF2Import");		
		if (isRF2Import)
		{
			var rf2 = this.get("rf2FileToImport");
			this.set("model.id",rf2.id);
			this.set("model.description",rf2.label);
		}

		var Refset = {};
		
		Refset.typeId 				= this.get("model.typeId");
		Refset.componentTypeId 		= this.get("model.componentTypeId");
		Refset.moduleId 			= this.get("model.moduleId");
		Refset.active 				= true; // Always make new refsets active
		Refset.languageCode 		= this.get("model.languageCode");
		Refset.description 			= this.get("model.description");
		
		var releaseDate 			= this.get("model.expectedReleaseDate");
		Refset.expectedReleaseDate 	= releaseDate;

		if (!this.disablePublishedFormFields || isRF2Import)
		{
			Refset.id 				= this.get("model.id");
			Refset.published 		= true;
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
	},

    actions :
    {
    	createRefsetComplete : function(response)
    	{
    		Ember.Logger.log("controller.refsets.new:actions:createRefsetComplete",response);

    		if (response.error)
    		{
    			var message = '<table class="centre"><tr><td><img src="assets/img/warning.jpg"></td><td style="vertical-align:middle"><h2>Refset creation failed.</h2></td></tr></table>';

    			if (typeof response.unauthorised !== "undefined")
    			{
    				message += '<br><br><p class="centre">You are not authorised to create refsets. You may need to sign in.</p>';
    			}

    			if (typeof response.commsError !== "undefined")
    			{
    				message += '<br><br><p class="centre">We cannot communicate with the Refset API at this time. Retry later.</p>';
    			}

    			this.dialogInstance.setMessage(message);
    			this.dialogInstance.setType(BootstrapDialog.TYPE_WARNING);
    			this.dialogInstance.getModalFooter().show();
    		}
    		else
    		{
    			var refsetId = response.id;

    			this.transitionToRoute('refsets.refset',response.id);
    			
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

    	importRF2Complete : function(response)
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
			this.set("rf2FileToImport.id","0");
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
