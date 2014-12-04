export default Ember.Select.extend({
	
	content : Ember.computed(function()
	{		
		var dataController 	= Refset.__container__.lookup("controller:data");
		
		Ember.Logger.log("++++++++++++++++++++++",this.dataType,dataController.get(this.dataType))
		
		
		return dataController.get(this.dataType);
	}),
 
	optionLabelPath : "content.label",
	optionValuePath : "content.id",
	classNames 		: "form-control"
});