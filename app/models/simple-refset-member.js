export default Ember.Object.extend({
	id:	null,
	moduleId: RefsetENV.APP.defaultSnomedTypes.moduleType,
	referencedComponentId: null,
	description: null,
	effectiveTime : null,
	active : true
});