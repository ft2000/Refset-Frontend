export default Ember.Object.extend({
	id:	null,
	active 			: true,
	componentTypeId : RefsetENV.APP.defaultSnomedTypes.componentType,
	description		: null,
	languageCode 	: 'en_US',
	members 		: [],
	moduleId		: RefsetENV.APP.defaultSnomedTypes.moduleType,
	published 		: true,
	expectedReleaseDate 	: function()
						{
							var mydate = moment.utc(this.get("meta.publishedDateInput"),'YYYYMMDD');
							return mydate.isValid() ? mydate.format() : null;
						}.property('meta.expectedReleaseDateInput'),
	typeId 			: RefsetENV.APP.defaultSnomedTypes.refsetType,
	meta			:
	{
		expectedReleaseDateInput : null,
	}
});