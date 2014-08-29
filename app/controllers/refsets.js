import RefsetAdapter from '../adapters/refsets';

export default Ember.ArrayController.extend({

	model : [],

	getAllRefsets : function()
	{
		var adapter = RefsetAdapter.create();
		
		var _this = this;
		
		adapter.findAll().then(function(result){
			_this.model.setObjects(result);
		});
	},

	addARefset : function()
	{
		this.get("model").pushObject({description:"This is a row I just added automatically via a method on the controller!!!",published:true});
	},
	
	actions :
	{
		
		addData : function()
		{
			this.get("model").pushObject({description:"This is a row I just added vi an action on the controller!!!",published:true});
		}
		
	}
	
});
