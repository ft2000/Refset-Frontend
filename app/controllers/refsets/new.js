import RefsetModel from '../../models/refset';

export default Ember.ObjectController.extend({
		
	model 	: RefsetModel.create(),
	
	doImportPublishedRefset : false,
	doImportMembers : false,
	
	needs : ["utilities","refsets","refsets/upload"],
	
	create : function()
	{
		// Need to serialise the form into the model

		var URLSerialisedData = $('#newRefsetForm').serialize();
		
		var utilitiesController = this.get('controllers.utilities');		
		var refsetData = utilitiesController.deserialiseURLString(URLSerialisedData);
		
		refsetData.active = (typeof refsetData.active !== "undefined" && refsetData.active === "1") ? true : false;

		delete refsetData["import"];
		delete refsetData["import-members"];
		
		this.set("model",refsetData);	
		
		var refsetController = this.get('controllers.refsets');
		refsetController.create(this.model);
	},
		
    actions :
    {
    	togglePublishedRefsetImportForm : function()
    	{
    		Ember.Logger.log("togglePublishedRefsetImportForm",this.doImportPublishedRefset);
    		this.set("doImportPublishedRefset",!this.doImportPublishedRefset);
    	},

		toggleMembersImportForm : function()
		{
			Ember.Logger.log("togglePublishedRefsetImportForm",this.doImportPublishedRefset);
			this.set("doImportMembers",!this.doImportMembers);
			
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
