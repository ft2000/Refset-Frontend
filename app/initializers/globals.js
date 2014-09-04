import User from '../models/user';

var globals = Ember.Object.extend({
  user : User.create()
});

export default 
{
  name: "Globals",

  initialize: function(container, application) 
  {
    application.register('global:variables', globals, {singleton: true});
    application.inject('controller', 'globals', 'global:variables');
    application.inject('adapter', 'globals', 'global:variables');
  }
};