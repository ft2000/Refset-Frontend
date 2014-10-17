export default Ember.Select.extend({
	
	content : Ember.computed(function()
	{
		var dataController 	= Refset.__container__.lookup("controller:data");
		return dataController.get(this.dataType);
	}),

	optionLabelPath : "content.label",
	optionValuePath : "content.id",
	classNames 		: "form-control"
});