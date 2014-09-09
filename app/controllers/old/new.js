import RefsetModel 			from '../../models/refset';
import UploadController 	from '../../controllers/refsets';
import RefsetController 	from '../../controllers/refsets';
import UtilitiesController	from '../../controllers/refsets';

var uploadController 		= UploadController.create();
var refsetController 		= RefsetController.create();
var utilities 				= UtilitiesController.create();

export default Ember.ObjectController.extend({
		
	model 	: RefsetModel.create(),
	members : uploadController.model,
	
	doImportPublishedRefset : false,
	doImportMembers : false,
	
	create : function(user)
	{
		// Need to serialise the form into the model

		var URLSerialisedData = $('#newRefsetForm').serialize();
		var refsetData = utilities.deserialiseURLString(URLSerialisedData);
		
		refsetData.active = (typeof refsetData.active !== "undefined" && refsetData.active === "1") ? true : false;
		
		this.set("model",refsetData);		
		
		refsetController.create(user,this.model);
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
					document.getElementById('refsetUploadFileInput').addEventListener('change', readSingleFile, false);
					document.getElementById('fileUploadDropZone').addEventListener('dragover', handleDragOver, false);
					document.getElementById('fileUploadDropZone').addEventListener('drop', readSingleFile, false);
				});
			}
			else
			{
				uploadController.clearMemberList();
			}
		},

    }
});
