import ajax from 'ic-ajax';

var AllRefsets;

export default Ember.Object.extend({
	findAll : function ()
	{
		if (typeof AllRefsets === "undefined")
		{
			var result = ajax(RefsetENV.APP.refsetApiBaseUrl).then(function(result){
				return result.content.refsets;
			});

			Ember.Logger.log("adapters:refsets:findAll",result);

			AllRefsets =  result;
		}
		
		return AllRefsets;
	}
});