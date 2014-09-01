import RefsetDataController from '../controllers/refset-data';

var controller = RefsetDataController.create();
	
export default Ember.ObjectController.extend({
	needs:		["application"],

	actions :
	{
		showRefset : function(id)
		{
			controller.getRefset(id);
		}
	}
});