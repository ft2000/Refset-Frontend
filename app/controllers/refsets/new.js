import RefsetModel 		from '../../models/refset';

export default Ember.ObjectController.extend({
		
	needs : ["login","utilities","refsets","refsets/upload","data"],

	refsetTypesArray 	: Ember.computed.alias("controllers.data.refsetTypesArray"),
	componentTypesArray : Ember.computed.alias("controllers.data.componentTypesArray"),
	moduleTypesArray 	: Ember.computed.alias("controllers.data.moduleTypesArray"),
	languagesArray		: [{id:'en_US',label:'International English'}],

	disablePublishedFormFields : true,
	
	getConceptDataInProgress 	: Ember.computed.alias("controllers.refsets/upload.getConceptDataInProgress"),
	importError 				: Ember.computed.alias("controllers.refsets/upload.importError"),
	
	dialogInstance : null,
		
	model : RefsetModel.create(),
	
	createEmptyRefset : function()
	{
		this.set("model",RefsetModel.create());
		this.set("model.meta.createdDateInput",null);
		this.set("model.meta.publishedDateInput",null);
		this.set("disablePublishedFormFields",true);

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
		
		var Refset = {};
		
		Refset.typeId = this.get("model.typeId");
		Refset.componentTypeId = this.get("model.componentTypeId");
		Refset.moduleId = this.get("model.moduleId");
		Refset.active = this.get("model.active");
		Refset.languageCode = this.get("model.languageCode");
		Refset.description = this.get("model.description");

		if (!this.disablePublishedFormFields)
		{
			Refset.id = this.get("model.id");
			Refset.published = this.get("model.published");
			Refset.publishedDate = this.get("model.publishedDate");
			Refset.created = this.get("model.created");
		}
		
		// Need to validate the form at this point and abort if required fields are not completed
		
		
/*
		var MemberData = [];
		$("#importedMemberForm input[type=checkbox]:checked").each(function ()
		{
			MemberData.push(parseInt($(this).val()));
		});

//				var uploadAdapter = _this.get('controllers.refsets/upload');		
//				uploadAdapter.clearMembers();

*/
		
		this.dialogInstance = BootstrapDialog.show({
            title: '<img src="assets/img/login.white.png"> Creating your refset',
            closable: false,
            message: '<br><br><div class="centre">We are creating your refset. Please wait...<br><br><img src="assets/img/googleballs-animated.gif"></div><br><br>',
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
    				message += '<br><br><p class="centre">You are not authorised to create refsets. You may need to log in.</p>';
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
    			this.transitionToRoute('refsets.refset',response.id);
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
		},

    }
});
