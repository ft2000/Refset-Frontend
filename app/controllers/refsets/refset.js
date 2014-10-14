import RefsetsAdapter 	from '../../adapters/refsets';
var refsetsAdapter = RefsetsAdapter.create();

export default Ember.ObjectController.extend({
		
	needs : ["login","data","application","refsets/upload"],
	
	model 				: Ember.computed.alias("controllers.data.refset"),
	refsetTypes 		: Ember.computed.alias("controllers.data.refsetTypes"),
	componentTypes 		: Ember.computed.alias("controllers.data.componentTypes"),
	moduleTypes 		: Ember.computed.alias("controllers.data.moduleTypes"),
	
	potentialMembersToImport	: Ember.computed.alias("controllers.refsets/upload.model"),
	getConceptDataInProgress 	: Ember.computed.alias("controllers.refsets/upload.getConceptDataInProgress"),
	importError 				: Ember.computed.alias("controllers.refsets/upload.importError"),

	membersToDelete 	: [],
	membersToAdd		: [],
	
	importListChangedInProgress	: false,

	dialogInstance	: null,

	initModel : function(params)
	{
		Ember.Logger.log("controllers.refsets.refset:initModel");
		
		var _this 			= this;
		var id 				= params.params["refsets.refset"].id;
		var dataController 	= this.get('controllers.data');
		
		// Run next so that we do not prevent the UI being displayed if the data is delayed...
		Ember.run.next(function()
		{
			dataController.getRefset(id,_this,'getRefsetComplete');			
		});
		
		var uploadController = this.get('controllers.refsets/upload');		
		uploadController.clearMemberList();

		Ember.run.scheduleOnce('afterRender', this, function(){
			document.getElementById('refsetUploadFileInput').addEventListener('change', readSingleFile, false);
			document.getElementById('fileUploadDropZone').addEventListener('dragover', handleDragOver, false);
			document.getElementById('fileUploadDropZone').addEventListener('dragenter', handleDragEnter, false);
			document.getElementById('fileUploadDropZone').addEventListener('dragleave', handleDragLeave, false);
			document.getElementById('fileUploadDropZone').addEventListener('drop', readSingleFile, false);
		
		});
	},

	importListChanged: function()
	{
		if (this.importListChangedInProgress) {return;}
		
		this.importListChangedInProgress = true;
		
		Ember.Logger.log("controllers.refsets.refset:importListChanged",this.get("potentialMembersToImport"));
		
		// Need  to check if we have any duplicates...
		var duplicates = [];
		
		var existingMembersArray = this.get("model").members;
		var potentialMembersToImport = this.get("potentialMembersToImport");
		
		if (typeof existingMembersArray !== "undefined")
		{
			for (var m=0;m<existingMembersArray.length;m++)
			{
				var existingMember = existingMembersArray[m];
				
				for (var i=0;i<potentialMembersToImport.length;i++)
				{
					var importMember = potentialMembersToImport[i];
					
					if (existingMember.referencedComponentId === importMember.referencedComponentId)
					{
						duplicates.push(importMember.meta.description);
						potentialMembersToImport[i] = null;
					}
				}
			}
			
			potentialMembersToImport = $.grep(potentialMembersToImport,function(n){ return(n) });

			var uploadController = this.get('controllers.refsets/upload');
			uploadController.overrideImportList(potentialMembersToImport);
			
			if (duplicates.length)
			{
				var message = 'Your import file contains ' + duplicates.length + ' concepts which are already included in this refset. These will be excluded from the import.<br><br>';
				
				for (var d=0;d<duplicates.length;d++)
				{
					message += duplicates[d] + '<br>';
				}
				
				this.dialogInstance = BootstrapDialog.show({
		            title: '<img src="assets/img/login.white.png"> Import members',
		            closable: false,
		            type : BootstrapDialog.TYPE_WARNING,
		            message: message,
		            buttons: [
	                {
		                label: 'OK',
		                cssClass: 'btn-primary',
		                action: function(dialogRef){
		            		dialogRef.close();
		                }
		            }]
		        });	
			}
			
			$("#importMemberList").collapse('show');
		}

		this.importListChangedInProgress = false;

	}.observes('potentialMembersToImport.@each'),
	
	actions :
	{
		getRefsetComplete : function (response)
		{
			Ember.Logger.log("controllers.refsets.refset:actions:getRefsetComplete",response);
			
			if (response.error)
			{
				// Model will then contain attributes that will modify the display...
				this.set("model",response);
			}
		},

		updateRefset : function()
		{
			Ember.Logger.log("controllers.refsets.refset:actions:updateRefset (Refset)",Refset);

			var _this = this;
			var refset = this.get("model");
			
			// Members we are going to update
			
			var membersToUpdate = refset.members.map(function(obj)
			{
				var member = $.extend(true, {}, obj);
				
				if (member.meta.deleteConcept) {return null;}
				
				if (member.active === member.meta.originalActive && member.moduleId === member.meta.originalModuleId) {return null;}
				
				Ember.Logger.log(member.active,member.meta.originalActive,member.moduleId,member.meta.originalModuleId);	
				
				delete member["meta"];
				
				return member;
			});
			membersToUpdate = $.grep(membersToUpdate,function(n){ return(n); });

			
			
			// members we are going to import
			
			
			var uploadController = this.get('controllers.refsets/upload');		
			var conceptsToImport = uploadController.getMembersMarkedForImport();
			
			this.set("membersToAdd",conceptsToImport);
			
			
			
			// Members we are going to delete
			
			var membersToDelete = refset.members.map(function(obj)
			{
				var member = $.extend(true, {}, obj);
				
				if (!member.meta.deleteConcept) {return null;}
				
				delete member["meta"];
				
				return member;
			});
			this.set("membersToDelete",$.grep(membersToDelete,function(n){ return(n);}));
						
			var message = '<div class="centre">Are you sure you wish to save your changes to this refset?</div><br><div class="centre">' + refset.description + '<br><br>';
				
			if (membersToUpdate.length || this.membersToAdd.length || this.membersToDelete.length)
			{
				message += '<div class="centre">You are ';				
			}
			
			if (membersToUpdate.length)
			{
				message += 'Updating ' + membersToUpdate.length + ' members';
				
				if (this.membersToAdd.length || this.membersToDelete.length)
				{
					message += ', ';
				}
			}
			
			if (this.membersToAdd.length)
			{
				message += 'Adding ' + this.membersToAdd.length + ' members';
				
				if (this.membersToDelete.length)
				{
					message += ', ';
				}
			}
			
			if (this.membersToDelete.length)
			{
				message += 'Deleting ' + this.membersToDelete.length + ' members';	
			}

			
			if (membersToUpdate.length || this.membersToDelete.length || this.membersToAdd.length)
			{
				message += '</div>';
			}
			
			this.dialogInstance = BootstrapDialog.show({
	            title: '<img src="assets/img/login.white.png"> Update refset',
	            closable: false,
	            message: message,
	            buttons: [{
	                label: 'No. Do not update',
	                cssClass: 'btn-default left',
	                action: function(dialogRef){
	                    dialogRef.close();
	                }
	            },
                {
	                label: 'Yes. Update refset',
	                cssClass: 'btn-primary',
	                action: function(dialogRef){
	                    _this.send("doUpdateRefset",membersToUpdate);
	                    dialogRef.close();
	                }
	            }]
	        });			
		},
		
		doUpdateRefset : function(membersToUpdate)
		{
			var dataController = this.get('controllers.data');
			var Refset = $.extend(true, {}, dataController.refset);
			
			// API barfs if we send it anything other than what it expects. So we keep extra data in meta so we can delete it easily...
			delete Refset["meta"];

			Refset.members = membersToUpdate;
			
			Ember.Logger.log("controllers.refsets.refset:actions:doUpdateRefset (Refset,membersToUpdate)",Refset,membersToUpdate);
						
			this.dialogInstance = BootstrapDialog.show({
	            title: '<img src="assets/img/login.white.png"> Updating your refset',
	            closable: false,
	            message: '<br><br><div class="centre">Updating. Please wait...<br><br><!-----><img src="assets/img/googleballs-animated.gif"></div><br><br>',
	            buttons: [{
	                label: 'OK',
	                cssClass: 'btn-primary',
	                action: function(dialogRef){
	                    dialogRef.close();
	                }
	            }]
	        });
			
			this.dialogInstance.getModalFooter().hide();
			
			dataController.updateRefset(Refset,this,'updateRefsetComplete');
		},	
		
		updateRefsetComplete : function(response)
		{
			Ember.Logger.log("controllers.refsets.refset:actions:updateRefsetComplete",response);
			
    		if (response.error)
    		{
    			var message = '<table class="centre"><tr><td><img src="assets/img/warning.jpg"></td><td style="vertical-align:middle"><h2>Refset update failed.</h2></td></tr></table>';

    			if (typeof response.unauthorised !== "undefined")
    			{
    				message += '<br><br><p class="centre">You are not authorised to update this refset. You may need to log in.</p>';
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
				var dataController = this.get('controllers.data');

				// Now Add / Delete any necessary members...
				if (this.membersToAdd.length)
    			{
    				// Need to add some members...

					var oldAddMessage = this.dialogInstance.getMessage();
    				var newAddMessage = oldAddMessage.replace(/<!----->/,'<div class="centre">Adding new members</div><br><br><!----->');
    				
    				this.dialogInstance.setMessage(newAddMessage);

    				dataController.addMembers(this.get("model").id,this.membersToAdd,this,'addMembersComplete');
    			}
    			else
    			{
        			if (this.membersToDelete.length)
    				{
        				// Need to delete some members...
        				
        				var oldDelMessage = this.dialogInstance.getMessage();
        				var newDelMessage = oldDelMessage.replace(/<!----->/,'<div class="centre">Deleting unwanted members</div><br><br><!----->');
        				
        				this.dialogInstance.setMessage(newDelMessage);
        				
        				dataController.deleteMembers(this.get("model").id,this.membersToDelete,this,'deleteMembersComplete');
    				}
    				else
    				{
    					// Nothing do do...
    	    			this.dialogInstance.close();
    				}
    			}
    		}	
		},

		addMembersComplete : function(response)
		{
			Ember.Logger.log("controllers.refsets.refset:actions:addMembersComplete",response);

			var uploadController = this.get('controllers.refsets/upload');		
			uploadController.clearMemberList();
			
			if (this.membersToDelete.length)
			{
				// Need to delete some members...
				
				var oldMessage = this.dialogInstance.getMessage();
				var newMessage = oldMessage.replace(/<!----->/,'<div class="centre">Deleting unwanted members</div><br><br><!----->');
				
				this.dialogInstance.setMessage(newMessage);
				
				var dataController = this.get('controllers.data');
				dataController.deleteMembers(this.get("model").id,this.membersToDelete,this,'deleteMembersComplete');
			}
			else
			{
				// Nothing do do...
    			this.dialogInstance.close();
			}
		},

		
		deleteMembersComplete : function(response)
		{
			Ember.Logger.log("controllers.refsets.refset:actions:deleteMembersComplete",response);

			// Nothing do do...
			this.dialogInstance.close();
		},

		exportRefset : function(id)
		{
			Ember.Logger.log("controllers.refsets.refset:actions:exportRefset (id)",id);
			
			var loginController = this.get('controllers.login');
			var user = loginController.user;
			
			refsetsAdapter.getRefsetExport(user, id).then(function(exportFile)
			{
				var blob = new Blob([exportFile], {type: "text/plain;charset=utf-8"});
				saveAs(blob, id + ".rf2");
			});	
		},	
		
		deleteRefset : function(id)
		{
			Ember.Logger.log("controllers.refsets.refset:actions:deleteRefset (id)",id);
			
			var _this = this;
			var refset = this.get("model");
			
			this.dialogInstance = BootstrapDialog.show({
	            title: '<img src="assets/img/login.white.png"> Delete refset',
	            closable: false,
	            message: '<br><br><div class="centre">Are you sure you wish to delete this refset?</div><br><br><div class="centre">' + refset.description + '<br><br>',
	            buttons: [{
	                label: 'No. Do not delete',
	                cssClass: 'btn-default left',
	                action: function(dialogRef){
	                    dialogRef.close();
	                }
	            },
                {
	                label: 'Yes. Delete refset',
	                cssClass: 'btn-primary',
	                action: function(dialogRef){
	                    _this.send("doDeleteRefset",id);
	                    dialogRef.close();
	                }
	            }]
	        });
		},	
		
		doDeleteRefset : function(id)
		{
			Ember.Logger.log("controllers.refsets.refset:actions:deleteRefset (id)",id);
						
			this.dialogInstance = BootstrapDialog.show({
	            title: '<img src="assets/img/login.white.png"> Deleting your refset',
	            closable: false,
	            message: '<br><br><div class="centre">Deleting. Please wait...<br><br><img src="assets/img/googleballs-animated.gif"></div><br><br>',
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
			dataController.deleteRefset(id,this,'deleteRefsetComplete');
		},
	
		deleteRefsetComplete : function (response)
		{
			Ember.Logger.log("controllers.refsets.refset:actions:deleteRefsetComplete",response);
			
    		if (response.error)
    		{
    			var message = '<table class="centre"><tr><td><img src="assets/img/warning.jpg"></td><td style="vertical-align:middle"><h2>Refset deletion failed.</h2></td></tr></table>';

    			if (typeof response.unauthorised !== "undefined")
    			{
    				message += '<br><br><p class="centre">You are not authorised to delete refsets. You may need to log in.</p>';
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
    			this.dialogInstance.close();
    			this.transitionToRoute('refsets');
    		}
		},
		
		clearImportList : function()
		{
			var uploadController = this.get('controllers.refsets/upload');		
			uploadController.clearMemberList();	
		}
	}
});
