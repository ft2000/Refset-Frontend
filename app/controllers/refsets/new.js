import RefsetModel 		from '../../models/refset';
import RefsetsAdapter 	from '../../adapters/refsets';

var refsetsAdapter = RefsetsAdapter.create();

export default Ember.ObjectController.extend({
		
	needs : ["login","utilities","refsets","refsets/upload","data"],

	refsetTypesArray 	: Ember.computed.alias("controllers.data.refsetTypesArray"),
	componentTypesArray : Ember.computed.alias("controllers.data.componentTypesArray"),
	moduleTypesArray 	: Ember.computed.alias("controllers.data.moduleTypesArray"),
	languagesArray		: [{id:'en_US',label:'International English'}],
		
	doImportPublishedRefset 	: false,
	getConceptDataInProgress 	: Ember.computed.alias("controllers.refsets/upload.getConceptDataInProgress"),
	importError 				: Ember.computed.alias("controllers.refsets/upload.importError"),
	
	createEmptyRefset : function()
	{
		this.set("model",RefsetModel.create());
		this.set("doImportPublishedRefset",false);
		Ember.Logger.log("controllers.refsets.new:createEmptyRefset",this.model);
	},
	
	create : function()
	{
		// Need to serialise the form into the model

		var URLSerialisedData 	= $('#newRefsetForm').serialize();

		var MemberData = [];
		$("#importedMemberForm input[type=checkbox]:checked").each(function ()
		{
			MemberData.push(parseInt($(this).val()));
		});

		var utilitiesController = this.get('controllers.utilities');		
		var refsetData = utilitiesController.deserialiseURLString(URLSerialisedData);
		
		refsetData.active = (typeof refsetData.active !== "undefined" && refsetData.active === "1") ? true : false;

		delete refsetData["import"];
		delete refsetData["import-members"];
		
		this.set("model",refsetData);	
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		var _this = this;

		refsetsAdapter.create(user,this.model).then(function(refset)
		{
			if (refset.meta.status === "CREATED")
			{
				Ember.Logger.log("Refset created:",refset.content.id);
				
				var refsetId = refset.content.id;
				
				MemberData.map(function(member)
				{
					Ember.Logger.log("Adding member",member);
					refsetsAdapter.addMember(user,refsetId,member);
				});
				
				_this.set("model",RefsetModel.create());
				var uploadAdapter = _this.get('controllers.refsets/upload');		
				uploadAdapter.clearMembers();
				
				_this.transitionToRoute('refsets.refset',refsetId);
			}
			else
			{
				Ember.Logger.log("Refset create failed:",refset.meta.message);				
			}	
		});
	},

    actions :
    {
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

    }
});
