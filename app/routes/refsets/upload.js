import UploadController from '../../controllers/refsets/upload';

var uploadController 		= UploadController.create();

export default Ember.Route.extend({
	   model: function() 
	   {
		   return  uploadController.model;
	   }
 });