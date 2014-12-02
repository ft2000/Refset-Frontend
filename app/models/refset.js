export default Ember.Object.extend({
	id:	null,
	active 			: true,
	componentTypeId : RefsetENV.APP.defaultSnomedTypes.componentType,
	created 		: function()
						{
							var mydate = moment.utc(this.get("meta.createdDateInput"),'MMMM D, YYYY');
							return mydate.isValid() ? mydate.format() : null;
						}.property('meta.createdDateInput'),
	description		: null,
	languageCode 	: 'en_US',
	members 		: [],
	moduleId		: RefsetENV.APP.defaultSnomedTypes.moduleType,
	published 		: function()
						{
							var mydate = moment.utc(this.get("meta.publishedDateInput"),'MMMM D, YYYY');
							return mydate.isValid();
						}.property('meta.publishedDateInput'),
	publishedDate 	: function()
						{
							var mydate = moment.utc(this.get("meta.publishedDateInput"),'MMMM D, YYYY');
							return mydate.isValid() ? mydate.format() : null;
						}.property('meta.publishedDateInput'),
	typeId 			: RefsetENV.APP.defaultSnomedTypes.refsetType,
	
	meta			:
	{
		createdDateInput 	: null,
		publishedDateInput 	: null,
		expectedReleaseDateInput : null,
	}
});