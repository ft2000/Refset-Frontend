export default Ember.View.extend({
  classNames: ['toggle-switch','inverted'],
  templateName: 'toggle-switch',
  
  init: function() {
    this._super.apply(this, arguments);
    return this.on('change', this, this._updateElementValue);
  },
  
  checkBoxId: (function() {
    return "checker-" + (this.get('elementId'));
  }).property(),
  
  _updateElementValue: function() {
	  if (typeof this.$('input') !== "undefined")
	  {
		    return this.set('checked', this.$('input').prop('checked'));
	  }
  }
});