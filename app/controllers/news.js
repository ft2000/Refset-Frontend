export default Ember.ArrayController.extend({
	
	model : [{
    	"id": "sprint-1",
    	"title": "Sprint 1 has started!",
    	"published": "2014-08-21T09:00:00",
    	"description": "The first sprint has begun, user authentication and listing refsets are the order of the day...",
	    "read": false
    },
	    {
    	"id": "meeting-2",
    	"title": "Team meet in Bristol",
    	"published": "2014-08-20T10:00:00",
    	"description": "The development team meet to discuss the development plan and in particular, the first sprint...",
	    "read": false
    },
    {
    	"id": "meeting-1",
    	"title": "Team meet in Bristol",
    	"published": "2014-08-13T10:00:00",
    	"description": "The development team meet to discuss kicking off the development plan...",
    	"read" : true
    }],

});
