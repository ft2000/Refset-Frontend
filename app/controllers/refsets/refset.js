import RefsetsAdapter 	from '../../adapters/refsets';
var refsetsAdapter = RefsetsAdapter.create();

export default Ember.ObjectController.extend({
		
	needs : ["login","data","application"],
	
	model 				: Ember.computed.alias("controllers.data.refset"),
	refsetTypes 		: Ember.computed.alias("controllers.data.refsetTypes"),
	componentTypes 		: Ember.computed.alias("controllers.data.componentTypes"),
	moduleTypes 		: Ember.computed.alias("controllers.data.moduleTypes"),
	
	membersToDelete 	: [],
	membersToAdd		: [],

	dialogInstance	: null,

	initModel : function(params)
	{
		Ember.Logger.log("controllers.refsets.refset:initModel");
		
		var _this 			= this;
		var id 				= params.params["refsets.refset"].id;
		var dataController 	= this.get('controllers.data');
		
		// Run next so that we do not prevent the UI being displayed if the data is delayed...
		return Ember.run.next(function(){dataController.getRefset(id,_this,'getRefsetComplete');});
	},

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
			
			var membersToUpdate = refset.members.map(function(obj)
			{
				var member = $.extend(true, {}, obj);
				
				if (member.meta.deleteConcept) {return null;}
				
				if (member.active === member.meta.originalActive && member.moduleId === member.meta.originalModuleId) {return null;}
				
				Ember.Logger.log(member.active,member.meta.originalActive,member.moduleId,member.meta.originalModuleId)				
				
				delete member["meta"];
				
				return member;
			});
			membersToUpdate = $.grep(membersToUpdate,function(n){ return(n) });

			this.set("membersToAdd",[]);
					
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
			
			var dataController = this.get('controllers.data');
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
    			// Now Add / Delete any necessary members...
				if (this.membersToAdd.length)
    			{
    				// Need to add some members...

					var oldMessage = this.dialogInstance.getMessage();
    				Ember.Logger.log("----------------------------",oldMessage);
    				var newMessage = oldMessage.replace(/<!----->/,'<div class="centre">Adding new members</div><br><br><!----->');
    				
    				this.dialogInstance.setMessage(newMessage);

    				var dataController = this.get('controllers.data');
    				dataController.addMembers(this.get("model").id,this.membersToAdd,this,'addMembersComplete');
    			}
    			else
    			{
        			if (this.membersToDelete.length)
    				{
        				// Need to delete some members...
        				
        				var oldMessage = this.dialogInstance.getMessage();
        				Ember.Logger.log("----------------------------",oldMessage);
        				var newMessage = oldMessage.replace(/<!----->/,'<div class="centre">Deleting unwanted members</div><br><br><!----->');
        				
        				this.dialogInstance.setMessage(newMessage);
        				
        				var dataController = this.get('controllers.data');
        				dataController.deleteMembers(this.get("model").id,this.membersToDelete,this,'deleteMembersComplete');
    				}
    				else
    				{
    					// Nothing do do...
    	    			this.dialogInstance.close();

//    	    			var dataController = this.get('controllers.data');
//   	    			dataController.getRefset(this.get("model").id,this,'getRefsetComplete');    					
    				}
    			}
    		}	
		},

		addMembersComplete : function(response)
		{
			Ember.Logger.log("controllers.refsets.refset:actions:addMembersComplete",response);

			if (this.membersToDelete.length)
			{
				// Need to delete some members...
				
				var oldMessage = this.dialogInstance.getMessage();
				Ember.Logger.log("----------------------------",oldMessage);
				var newMessage = oldMessage.replace(/<!----->/,'<div class="centre">Deleting unwanted members</div><br><br><!----->');
				
				this.dialogInstance.setMessage(newMessage);
				
				var dataController = this.get('controllers.data');
				dataController.deleteMembers(this.get("model").id,this.membersToDelete,this,'deleteMembersComplete');
			}
			else
			{
				// Nothing do do...
    			this.dialogInstance.close();

//    			var dataController = this.get('controllers.data');
//   			dataController.getRefset(this.get("model").id,this,'getRefsetComplete');    					
			}
		},

		
		deleteMembersComplete : function(response)
		{
			Ember.Logger.log("controllers.refsets.refset:actions:deleteMembersComplete",response);

			// Nothing do do...
			this.dialogInstance.close();

//			var dataController = this.get('controllers.data');
//			dataController.getRefset(this.get("model").id,this,'getRefsetComplete');  
		},

		exportRefset : function(id)
		{
			Ember.Logger.log("controllers.refsets.refset:actions:exportRefset (id)",id);
			
			var loginController = this.controllerFor('login');
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
	}
});
