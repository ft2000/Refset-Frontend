import RefsetsAdapter 	from '../../adapters/refsets';
var refsetsAdapter = RefsetsAdapter.create();

export default Ember.ObjectController.extend({
		
	needs : ["login","data","application","refsets/upload"],
	
	user						: Ember.computed.alias("controllers.login.user"),
	
	model 						: Ember.computed.alias("controllers.data.refset"),
	refsetHistory 				: Ember.computed.alias("controllers.data.refsetHistory"),
	refsetTypes 				: Ember.computed.alias("controllers.data.refsetTypes"),
	componentTypes 				: Ember.computed.alias("controllers.data.componentTypes"),
	moduleTypes 				: Ember.computed.alias("controllers.data.moduleTypes"),
	languageTypes 				: Ember.computed.alias("controllers.data.languageTypes"),
	moduleTypesArray			: Ember.computed.alias("controllers.data.moduleTypesArray"),
	moduleUpdatersArray			: Ember.computed.alias("controllers.data.moduleUpdatersArray"),
	effectiveTimeArray			: Ember.computed.alias("controllers.data.effectiveTimeArray"),
	
	potentialMembersToImport	: Ember.computed.alias("controllers.refsets/upload.model"),
	getConceptDataInProgress 	: Ember.computed.alias("controllers.refsets/upload.getConceptDataInProgress"),
	importError 				: Ember.computed.alias("controllers.refsets/upload.importError"),
	importProgress				: Ember.computed.alias("controllers.refsets/upload.importProgress"),
	isRF2Import					: Ember.computed.alias("controllers.refsets/upload.isRF2Import"),

	editModel					: {},	
	membersToDelete 			: [],
	membersToAdd				: [],
	
	editMode					: false,
	showMetaData				: false,
		
	importListChangedInProgress	: false,

	dialogInstance				: null,
	
	filterByStatus 				: -1,
	filterByModuleId 			: -1,
	filterByEffectiveTime		: -1,
	filterByLastUpdateDate		: -1,
	filterByLastUpdateUser		: -1,
	filterByInactiveConcepts	: -1,
	filterByModifiedMembers		: -1,
	filterByPublishedMembers	: -1,
	filterByDescription			: '',
	
	filterByStatusIsActive				: function(){ return this.filterByStatus !== -1;}.property('filterByStatus'),
	filterByModuleIdIsActive			: function(){ return this.filterByModuleId !== -1;}.property('filterByModuleId'),
	filterByEffectiveTimeIsActive		: function(){ return this.filterByEffectiveTime !== -1;}.property('filterByEffectiveTime'),
	filterByLastUpdateDateIsActive		: function(){ return this.filterByLastUpdateDate !== -1;}.property('filterByLastUpdateDate'),
	filterByLastUpdateUserIsActive		: function(){ return this.filterByLastUpdateUser !== -1;}.property('filterByLastUpdateUser'),
	filterByInactiveConceptsIsActive	: function(){ return this.filterByInactiveConcepts !== -1;}.property('filterByInactiveConcepts'),
	filterByModifiedMembersIsActive		: function(){ return this.filterByModifiedMembers !== -1;}.property('filterByModifiedMembers'),
	filterByPublishedMembersIsActive	: function(){ return this.filterByPublishedMembers !== -1;}.property('filterByPublishedMembers'),
	
	sortBy 								: 'referencedComponent.label',
	sortOrder							: 'asc',

	filteringActive						: function()
	{ 
		if (this.get("filterByStatusIsActive")) { return true; }
		if (this.get("filterByModuleIdIsActive")) { return true; }
		if (this.get("filterByEffectiveTimeIsActive")) { return true; }
		if (this.get("filterByLastUpdateDateIsActive")) { return true; }
		if (this.get("filterByLastUpdateUserIsActive")) { return true; }
		if (this.get("filterByInactiveConceptsIsActive")) { return true; }
		if (this.get("filterByPublishedMembersIsActive")) { return true; }
		
	}.property('model.members.@each','sortBy','sortOrder','filterByModifiedMembers','filterByPublishedMembers','filterByStatus','filterByModuleId','filterByEffectiveTime','filterByDescription','filterByInactiveConcepts','filterByLastUpdateDate','filterByLastUpdateUser'),

	filteredMembers						: function()
	{
		var allMembers = this.get('model.members');
		
		return this.filterMembers(allMembers);
		
	}.property('model.members.@each', 'sortBy','sortOrder','filterByStatus','filterByModuleId','filterByPublishedMembers','filterByEffectiveTime','filterByDescription','filterByInactiveConcepts','filterByLastUpdateDate','filterByLastUpdateUser','filterByModifiedMembers'),

	filteredImportMembers				: function()
	{
		var allMembers = this.get('potentialMembersToImport');
		
		Ember.Logger.log("filteredImportMembers",this.get("isRF2Import"));
		
		return this.filterMembers(allMembers);
		
	}.property('potentialMembersToImport.@each', 'sortBy','sortOrder','filterByStatus','filterByModuleId','filterByPublishedMembers','filterByEffectiveTime','filterByDescription','filterByInactiveConcepts','filterByLastUpdateDate','filterByLastUpdateUser','filterByModifiedMembers'),

	
	clearAllFilters : function()
	{
		this.set("filterByStatus",-1);
		this.set("filterByModuleId",-1);
		this.set("filterByEffectiveTime",-1);
		this.set("filterByLastUpdateDate",-1);
		this.set("filterByLastUpdateUser",-1);
		this.set("filterByInactiveConcepts",-1);
		this.set("filterByModifiedMembers",-1);
		this.set("filterByDescription","");	
		this.set("filterByPublishedMembers",-1);
	},
	
	filterMembers : function(allMembers)
	{
		if (typeof allMembers !== "undefined")
		{
			var filterByStatus 				= this.get("filterByStatus");
			var filterByModuleId 			= this.get("filterByModuleId");
			var filterByEffectiveTime 		= this.get("filterByEffectiveTime");
			var filterByDescription 		= this.get("filterByDescription");
			var filterByLastUpdateDate 		= this.get("filterByLastUpdateDate");
			var filterByLastUpdateUser 		= this.get("filterByLastUpdateUser");
			var filterByModifiedMembers 	= this.get("filterByModifiedMembers");
			var filterByInactiveConcepts	= this.get("filterByInactiveConcepts");
			var filterByPublishedMembers	= this.get("filterByPublishedMembers");
			
			var filteredMembers = allMembers.map(function(member)
			{
				if (typeof member !== "undefined")
				{
					if (filterByStatus !== -1)
					{
						if (member.active !== filterByStatus)
						{
							return null;
						}
					}
					
					if (filterByModuleId !== -1)
					{
						if (member.moduleId !== filterByModuleId)
						{
							return null;
						}
					}

					if (filterByEffectiveTime !== -1)
					{
						if (member.latestEffectiveTime !== filterByEffectiveTime)
						{
							return null;
						}
					}
					
					if (filterByLastUpdateDate !== -1)
					{
						var comparisonDate = new Date(filterByLastUpdateDate);
						
						if (comparisonDate instanceof Date && !isNaN(comparisonDate.valueOf()))
						{
							if (new Date(member.modifiedDate).getTime() < comparisonDate.getTime())
							{
								return null;
							}
						}
					}
					
					if (filterByInactiveConcepts !== -1)
					{
						if (member.referencedComponent.active !== filterByInactiveConcepts)
						{
							return null;
						}
					}	

					
					if(filterByModifiedMembers !== -1)
					{
						if (member.memberHasPendingEdit !== filterByModifiedMembers)
						{
							return null;
						}
					}
					
					if(filterByPublishedMembers !== -1)
					{
						if (member.memberHasPublishedState !== filterByPublishedMembers)
						{
							return null;
						}
					}
					
					if (filterByLastUpdateUser !== -1)
					{
						if (member.modifiedBy !== filterByLastUpdateUser)
						{
							return null;
						}
					}
					
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
							score = LiquidMetal.score(member.referencedComponent.label, filterByDescription);

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
			
			if (filterByDescription !== '' && sortOrder === "score" && (sortBy === "referencedComponent.label" || sortBy === "referencedComponentId"))
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
	
	memberRowHeight  			: function()
	{
		if (this.editMode)
		{
			return this.showMetaData ? 86 : 56;			
		}
		else
		{
			return this.showMetaData ? 80 : 50;
		}
	}.property("showMetaData","editMode"),

	initModel : function(params)
	{
		Ember.Logger.log("controllers.refsets.refset:initModel");
		
		this.set("editMode",false);
		this.set("filterByDescription","");
		this.set("showMetaData",false);
		
		this.clearAllFilters();
		
		var _this 			= this;
		var uuid 				= params.params["refsets.refset"].uuid;

		var dataController 	= this.get('controllers.data');

		// Run next so that we do not prevent the UI being displayed if the data is delayed...
		Ember.run.next(function()
		{
			dataController.getRefset(uuid,_this,'getRefsetComplete');
			dataController.getRefsetHistory(uuid,_this,'getRefsetHistoryComplete');
		});
	
		var uploadController = this.get('controllers.refsets/upload');		
		uploadController.clearMemberList();
	},

	importListChanged: function()
	{
		if (this.importListChangedInProgress) {return;}
		
		this.importListChangedInProgress = true;
		
		Ember.Logger.log("controllers.refsets.refset:importListChanged");
		
		
		if (this.get("isRF2Import"))
		{
			var uploadController = this.get('controllers.refsets/upload');		
			uploadController.clearMemberList();
		}
		
		// Need  to check if we have any duplicates...
		var duplicates = [];
		
		var existingMembersArray 		= this.get("model").members;
		var potentialMembersToImport 	= this.get("potentialMembersToImport");
		
		if (typeof existingMembersArray !== "undefined" && potentialMembersToImport.length > 0)
		{
			for (var m=0;m<existingMembersArray.length;m++)
			{
				var existingMember = existingMembersArray[m];
				
				for (var i=0;i<potentialMembersToImport.length;i++)
				{
					var importMember = potentialMembersToImport[i];
					
					if (importMember !== null)
					{
						if (existingMember.referencedComponentId === importMember.referencedComponentId)
						{
							duplicates.push(importMember.description);
							potentialMembersToImport[i] = null;
						}
					}
				}
			}
			
			potentialMembersToImport = $.grep(potentialMembersToImport,function(n){ return(n); });

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
		            title: 'Import members',
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
	
	getDefaultModuleId : function()
	{
		var members = this.get("model.members");
		return members[0].moduleId;
	},
	
	getDefaultLastUpdater : function()
	{
		var members = this.get("model.members");
		return members[0].modifiedBy;
	},
	
	getDefaultEffectiveTime : function()
	{
		var times = this.get("effectiveTimeArray");
		return times[0].id;
	},

	actions :
	{
		setSortCriteria : function(sortBy)
		{
			var oldSortBy 			= this.get("sortBy");
			var oldSortOrder 		= this.get("sortOrder");
			var filterByDescription	= this.get("filterByDescription");

			var sortOrder = "asc";

			if (oldSortBy === sortBy)
			{
				switch (oldSortOrder)
				{
					case "asc":
					{
						sortOrder = "desc";
						break;
					}

					case "desc":
					{						
						if (sortBy === "referencedComponent.label" && filterByDescription !== "")
						{
							sortOrder = "score";
						}
						break;
					}	
				}
			}
			else
			{
				if (sortBy === "referencedComponent.label" && filterByDescription !== "")
				{
					sortOrder = "score";
				}
			}
			
			this.set("sortBy",sortBy);
			this.set("sortOrder",sortOrder);
		},
		
		toggleEditMode : function()
		{
			this.set("editMode",!this.editMode);
			
			if (this.editMode)
			{
				this.set("editModel",$.extend(true, {}, this.get("model")));
				
				Ember.run.scheduleOnce('afterRender', this, function(){
					document.getElementById('refsetUploadFileInput').addEventListener('change', readSingleFile, false);
					document.getElementById('fileUploadDropZone').addEventListener('dragover', handleDragOver, false);
					document.getElementById('fileUploadDropZone').addEventListener('dragenter', handleDragEnter, false);
					document.getElementById('fileUploadDropZone').addEventListener('dragleave', handleDragLeave, false);
					document.getElementById('fileUploadDropZone').addEventListener('drop', readSingleFile, false);				
				});
			}
		},

		toggleMetaData : function()
		{
			this.set("showMetaData",!this.showMetaData);
		},
		
		cancelEdits : function()
		{
			var uploadController = this.get('controllers.refsets/upload');		
			uploadController.clearMemberList();	
			this.set("editMode",false);
			this.set("model",$.extend(true, {}, this.get("editModel")));	
		},
		
		toggleDeleteMember : function(memberId)
		{
			Ember.Logger.log("toggleDeleteMember",memberId);
			
			var refset = $.extend(true, {}, this.get("model"));
			
			for (var m=0;m<refset.members.length;m++)
			{
				if (refset.members[m].uuid === memberId)
				{
					refset.members[m].meta.deleteConcept = !refset.members[m].meta.deleteConcept;
					this.set("model",refset);
					break;
				}
			}
		},

		showImportHelp : function()
		{
			var uploadController = this.get('controllers.refsets/upload');	
			uploadController.showImportHelp();	
		},
		
		toggleMemberActive : function(memberId)
		{
			Ember.Logger.log("toggleMemberActive",memberId);

			var refset = $.extend(true, {}, this.get("model"));
			
			for (var m=0;m<refset.members.length;m++)
			{
				if (refset.members[m].uuid === memberId)
				{
					refset.members[m].active = !refset.members[m].active;
					this.set("model",refset);
					break;
				}
			}
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
		
		getRefsetComplete : function (response)
		{
			if (response.error)
			{
				// Model will then contain attributes that will modify the display...
				this.set("model",response);
			}
		},
		
		getRefsetHistoryComplete : function (response)
		{
			Ember.Logger.log("controllers.refsets.refset:actions:getRefsetHistoryComplete",response);
			
			if (response.error)
			{
				// History will then contain attributes that will modify the display...
				this.set("history",response);
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
	            title: 'Update refset',
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
	            title: 'Updating your refset',
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

    				dataController.addMembers(this.get("model").uuid,this.membersToAdd,this,'addMembersComplete');
    			}
    			else
    			{
        			if (this.membersToDelete.length)
    				{
        				// Need to delete some members...
        				
        				var oldDelMessage = this.dialogInstance.getMessage();
        				var newDelMessage = oldDelMessage.replace(/<!----->/,'<div class="centre">Deleting unwanted members</div><br><br><!----->');
        				
        				this.dialogInstance.setMessage(newDelMessage);
        				
        				dataController.deleteMembers(this.get("model").uuid,this.membersToDelete,this,'deleteMembersComplete');
    				}
    				else
    				{
    					// Nothing do do...
    					this.set("editMode",false);
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
				dataController.deleteMembers(this.get("model").uuid,this.membersToDelete,this,'deleteMembersComplete');
			}
			else
			{
				// Nothing do do...
				this.set("editMode",false);
    			this.dialogInstance.close();
			}
		},

		
		deleteMembersComplete : function(response)
		{
			Ember.Logger.log("controllers.refsets.refset:actions:deleteMembersComplete",response);

			// Nothing do do...
			this.set("editMode",false);
			this.dialogInstance.close();
		},

		exportRefset : function()
		{
			var refset = this.get("model");
			var id = refset.uuid;
			
			Ember.Logger.log("controllers.refsets.refset:actions:exportRefset (id)",id);
			
			var loginController = this.get('controllers.login');
			var user = loginController.user;
			var _this = this;
			
			this.dialogInstance = BootstrapDialog.show({
	            title: 'Export refset',
	            closable: false,
	            message: '<br><br><div class="centre">We are preparing your refset export file. Please wait...</div><br><br><div class="centre"><img src="assets/img/googleballs-animated.gif"></div><br><br>',
	            type: 'BootstrapDialog.',
	            buttons: [{
	                label: 'Give up',
	                cssClass: 'btn-primary',
	                action: function(dialogRef)
	                {
	                    dialogRef.close();
	                }
	            },{
	                label: 'Retry',
	                cssClass: 'btn-primary',
	                action: function(dialogRef)
	                {
	                	_this.send("exportRefset");
	                    dialogRef.close();
	                }
		         }]
	        });

			this.dialogInstance.getModalFooter().hide();

			refsetsAdapter.getRefsetExport(user, id).then(function(response)
			{
				try
				{
					var exportFile = response.response;
					var contentDisposition = response.jqXHR.getResponseHeader('Content-Disposition');			
					
					var filename = contentDisposition.split('"')[1];

					var RF2 = new Blob([exportFile], {type: "text/plain;charset=utf-8"});

					_this.dialogInstance.close();

					saveAs(RF2, filename);
				}
				catch(e)
				{
	    			_this.dialogInstance.setMessage('<br><br><div class="centre">We have been unable to retrieve your refset export file. Would you like to retry.</div></br></br>');
	    			_this.dialogInstance.setType(BootstrapDialog.TYPE_WARNING);
	    			_this.dialogInstance.getModalFooter().show();
				}
			});	
		},	
		
		deleteRefset : function()
		{
			
			var _this 	= this;
			var refset 	= this.get("model");			
			var id 		= refset.uuid;
			
			Ember.Logger.log("controllers.refsets.refset:actions:deleteRefset (id)",id);

			this.dialogInstance = BootstrapDialog.show({
	            title: 'Delete refset',
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
	            title: 'Deleting your refset',
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

   				message += '<br><br><p class="centre">' +  response.message +'</p>';

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
		
		activateRefset : function()
		{
			
			var refset 	= this.get("model");			
			
			refset.active = true;
			delete refset["members"];
			delete refset["meta"];
			
			Ember.Logger.log("controllers.refsets.refset:actions:activateRefset");

			this.dialogInstance = BootstrapDialog.show({
	            title: 'Activating your refset',
	            closable: false,
	            message: '<br><br><div class="centre">Activating. Please wait...<br><br><img src="assets/img/googleballs-animated.gif"></div><br><br>',
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
			dataController.updateRefset(refset,this,'activateRefsetComplete');
			
		},	
	
		inactivateRefset : function()
		{
			var refset 	= this.get("model");	
			
			refset.active = false;
			delete refset["members"];
			delete refset["meta"];
			
			Ember.Logger.log("controllers.refsets.refset:actions:inactivateRefset");

			this.dialogInstance = BootstrapDialog.show({
	            title: 'Inactivating your refset',
	            closable: false,
	            message: '<br><br><div class="centre">Inactivating. Please wait...<br><br><img src="assets/img/googleballs-animated.gif"></div><br><br>',
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
			dataController.updateRefset(refset,this,'activateRefsetComplete');
			
		},	
		
		activateRefsetComplete : function (response)
		{
			Ember.Logger.log("controllers.refsets.refset:actions:activateRefsetComplete",response);
			
    		if (response.error)
    		{
    			var message = '<table class="centre"><tr><td><img src="assets/img/warning.jpg"></td><td style="vertical-align:middle"><h2>Refset activation/inactivation failed.</h2></td></tr></table>';

    			if (typeof response.unauthorised !== "undefined")
    			{
    				message += '<br><br><p class="centre">You are not authorised to activate/inactivate refsets. You may need to log in.</p>';
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
    			var refset = this.get("model");
    			this.initModel({params:{"refsets.refset":refset}});
    		}
		},
	
		clearImportList : function()
		{
			var uploadController = this.get('controllers.refsets/upload');		
			uploadController.clearMemberList();	
		},
		
		addFilter : function()
		{
			Ember.Logger.log("controllers.refsets.refset:actions:addFilter");
			
			var filterName = $('#filterSelect').val();
			var defaultValue = true;
			
			switch(filterName)
			{
				case 'filterByModuleId' : {defaultValue = this.getDefaultModuleId(); break;}
				case 'filterByEffectiveTime' : {defaultValue = this.getDefaultEffectiveTime(); break;}
				case 'filterByLastUpdateDate' : {defaultValue = ''; break;}
				case 'filterByLastUpdateUser' : {defaultValue = this.getDefaultLastUpdater(); break;}
				case 'filterByModifiedMembers' : {defaultValue = "1"; break;}
				case 'filterByInactiveConcepts' : {defaultValue = false; break;}
				case 'filterByPublishedMembers' : {defaultValue = "1"; break;}
			}
		
			this.set(filterName,defaultValue);
			
			$('#filterSelect').val(0);

		},

		removeFilter : function(filterName)
		{
			Ember.Logger.log("controllers.refsets.refset:actions:removeFilter",filterName);
			
			this.set(filterName,-1);
			
			var _this = this;
			
			Ember.run.next(function()
			{
				_this.set(filterName,-1); // deals with selects changing the value again!
			});			
		},
		
		clearDescriptionFilter : function()
		{
			this.set("filterByDescription","");
			this.set("sortOrder","asc");
		},
		
		setSortToBestMatch : function()
		{
			Ember.Logger.log("setSortToBestMatch");
			this.set("sortOrder","score");
		},
		
		showMetaData : function(member)
		{
			Ember.Logger.log("showMetaData",member);
			
			var modifiedDate 	= new Date(member.modifiedDate);
			var createdDate 	= new Date(member.created);
			
			var message = "<p><b>" + member.referencedComponent.label + "</b></p>";
			
			message += "<p><table width=100%>";
			
			message += "<tr><td align=right>Referenced Component Id :&nbsp;</td><td><b>" + member.referencedComponent.id + "</b></td></tr>";

			message += "<tr><td align=right>Status :&nbsp;</td><td><b>" + (member.active ? "Active" : "Inactive") + "</b></td></tr>";
			message += "<tr><td align=right>Concept Status :&nbsp;</td><td><b>" + (member.referencedComponent.active ? "Active" : "Inactive") + "</b></td></tr>";

			message += "<tr><td align=right>Module Id :&nbsp;</td><td><b>" + member.moduleId + "</b></td></tr>";
			message += "<tr><td align=right>Member Id :&nbsp;</td><td><b>" + member.uuid + "</b></td></tr>";
			
			message += "<tr><td align=right>Created by :&nbsp;</td><td><b>" + member.createdBy + "</b> on <b>" + $.formatDateTime('M dd, yy', createdDate) +"</b></td></tr>";
			message += "<tr><td align=right>Last modified by :&nbsp;</td><td><b>" + member.modifiedBy + "</b> on <b>" + $.formatDateTime('M dd, yy', modifiedDate) +"</b></td></tr>";
			
			message += "<tr><td align=right>Effective Time :&nbsp;</td><td><b>" 
			if (typeof member.effectiveTime !== "undefined")
			{
				var effectiveTime 	= new Date(member.effectiveTime);
				message += $.formatDateTime('yymmdd', effectiveTime) +"</b></td></tr>";
			}
			
			message += "<tr><td align=right>Published :&nbsp;</td><td><b>" + (member.memberHasPublishedState ? "Yes" : "No") + "</b></td></tr>";
			message += "<tr><td align=right>Edited :&nbsp;</td><td><b>" + (member.memberHasPendingEdit ? "Yes" : "No") + "</b></td></tr>";
			
			message += "</table></p>";
			
	        BootstrapDialog.show({
	            title: "Member data",
	            closable: false,
	            message: message,
	            buttons: [{
	                label: 'Close',
	                action: function(dialog) {
	                    dialog.close();
	                }
	            }]
	        });
		},

		showHistory : function(member)
		{
			Ember.Logger.log("showHistory",member);
			
			var dataController 	= this.get('controllers.data');
			
			dataController.getRefsetMemberHistory(this.get("model").uuid,member.uuid,this,'showHistoryComplete');
		},
		
		showHistoryComplete : function(response)
		{
			Ember.Logger.log("showHistoryComplete",response);
			
			var message = "";
			var moduleTypes = this.get("moduleTypes");
			
			if (!response.error)
			{
				message += "<div style='max-height:90%;overflow-x:hidden;overflow-y:auto'>";
				
				response.history = mergesort(response.history,'modifiedDate','desc');
				
				message += "<p><table width='100%'>"; 
				message += "<tr style='border-bottom:1px solid #ccc'><td>Effective Time</td><td>Status</td><td>Module Id</td></tr>"; 

				response.history.map(function(item){
					var effectiveTime = new Date(item.effectiveTime);
					
					if (typeof item.moduleId === "undefined")
					{
						item.moduleId 	= "Unknown";
					}
					
					message += "<tr><td><b>" + $.formatDateTime('yymmdd', effectiveTime) +"</b></td>";
					message += "<td><b>" + (item.active ? "Active" : "Inactive") + "</b></td>";
					message += "<td><b><span class='pointer' rel='tooltip' title='" + moduleTypes[item.moduleId] + "'>" + item.moduleId + "</span></b></td>";
					message += "</tr>"; 
				});
				
				message += "</table></div>";
			}
			else
			{
				message = "Unable to retrieve member history.<br><br>" + response.message;				
			}
			
	        BootstrapDialog.show({
	            title: "Member history",
	            closable: false,
	            message: message,
	            buttons: [{
	                label: 'Close',
	                action: function(dialog) {
	                    dialog.close();
	                }
	            }]
	        });
		}

	}
});
