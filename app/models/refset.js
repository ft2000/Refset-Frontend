export default Ember.Object.extend({
	id:	null,
	moduleId		: RefsetENV.APP.defaultSnomedTypes.moduleType,
	description		: null,
	createdBy 		: null,
	created 		: null,
	languageCode 	: 'en_US',
	typeId 			: RefsetENV.APP.defaultSnomedTypes.refsetType,
	componentTypeId : RefsetENV.APP.defaultSnomedTypes.componentType,
	members 		: [],
	publishedDate 	: null,
	effectiveTime 	: null,
	active 			: true,
	published 		: null
});