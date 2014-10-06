import RefsetsAdapter 	from '../../adapters/refsets';
var refsetsAdapter = RefsetsAdapter.create();

export default Ember.ObjectController.extend({
		
	needs : ["login","data","application"],
	
	model 			: Ember.computed.alias("controllers.data.refset"),
	refsetTypes 	: Ember.computed.alias("controllers.data.refsetTypes"),
	componentTypes 	: Ember.computed.alias("controllers.data.componentTypes"),
	moduleTypes 	: Ember.computed.alias("controllers.data.moduleTypes"),
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
			var dataController = this.get('controllers.data');
			var Refset = $.extend(true, {}, dataController.refset);
			
			Ember.Logger.log("controllers.refsets.refset:actions:updateRefset (Refset)",Refset);

			delete Refset["meta"];

			for (var m=0;m<Refset.members.length;m++)
			{
				delete Refset.members[m]["meta"];
			}
			
			/*
			var MembersToDelete = [];
			$(".checkboxList input[name=deleteConcept]:checked").each(function ()
			{
				MembersToDelete.push(parseInt($(this).val()));
			});			
			
			for (var m=Refset.members.length-1;m>=0;m--)
			{
				if ($.inArray(Refset.members[m].referenceComponentId,MembersToDelete))
				{
					Refset.members.splice(m,1);
				}
			}
			Ember.Logger.log("finished checking",Refset.members.length);
			
			var ActiveMembers = [];
			$(".checkboxList input[name=conceptId]:checked").each(function ()
			{
				ActiveMembers.push(parseInt($(this).val()));
			});			
			Ember.Logger.log("ActiveMembers",ActiveMembers);

			
			var URLSerialisedData 	= $('#refsetEditForm').serialize();
			Ember.Logger.log("$('#refsetEditForm')",$('#refsetEditForm'));

			var utilitiesController = this.controllerFor('utilities');
			var updatedData = utilitiesController.deserialiseURLString(URLSerialisedData);
			
			for (var key in updatedData)
			{
				Refset[key] = updatedData[key];
			}
*/
			
			var loginController = this.controllerFor('login');
			var user = loginController.get("user");
			
			refsetsAdapter.update(user,Refset).then(function(refset)
			{
				if (refset.meta.status === "OK")
				{
					Ember.Logger.log("Refset updated:",refset.content.id);
				}
				else
				{
					Ember.Logger.log("Refset update failed:",refset.meta.message);				
				}	
			});
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
