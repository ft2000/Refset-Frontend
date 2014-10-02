import RefsetModel 		from '../../models/refset';
import RefsetsAdapter 	from '../../adapters/refsets';

var refsetsAdapter = RefsetsAdapter.create();

export default Ember.ObjectController.extend({
		
	needs : ["login","utilities","refsets","refsets/upload","data"],

	refsetTypesArray 	: Ember.computed.alias("controllers.data.refsetTypesArray"),
	componentTypesArray : Ember.computed.alias("controllers.data.componentTypesArray"),
	moduleTypesArray 	: Ember.computed.alias("controllers.data.moduleTypesArray"),
	languagesArray		: [{id:'en_US',label:'International English'}],

	disablePublishedFormFields : true,
	
	getConceptDataInProgress 	: Ember.computed.alias("controllers.refsets/upload.getConceptDataInProgress"),
	importError 				: Ember.computed.alias("controllers.refsets/upload.importError"),
		
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
		
		Ember.Logger.log(Refset);
		
/*
		var MemberData = [];
		$("#importedMemberForm input[type=checkbox]:checked").each(function ()
		{
			MemberData.push(parseInt($(this).val()));
		});
*/
		
		var loginController = this.get('controllers.login');
		var user = loginController.user;
		
		var _this = this;

		refsetsAdapter.create(user,Refset).then(function(refset)
		{
			if (refset.meta.status === "CREATED")
			{
				Ember.Logger.log("Refset created:",refset.content.id);
				
				var refsetId = refset.content.id;
				
/*
				MemberData.map(function(member)
				{
					Ember.Logger.log("Adding member",member);
					refsetsAdapter.addMember(user,refsetId,member);
				});
*/				
				_this.set("model",RefsetModel.create());
//				var uploadAdapter = _this.get('controllers.refsets/upload');		
//				uploadAdapter.clearMembers();
				
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
		
		clearForm : function()
		{
			this.createEmptyRefset();
		},

    }
});
