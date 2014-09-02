export default Ember.ArrayController.extend({
	
	model : 
	[
		{
	    	"id": "news",
	    	"title": "News...",
	    	"published": "2014-09-02T10:00:00",
	    	"description": "We will use this news section to post information about updates to the app. There is no back-end for this for now. Possibly in the future. For now, it's coded into the app, which is fine since we'll need to re-deploy when we make changes anyway. This is just to let users know about new features etc. in each release."
	    },
		{
	    	"id": "authentication",
	    	"title": "User Authentication",
	    	"published": "2014-09-02T09:00:00",
	    	"description": "The app now integrated with the user authentication server. You may log in/log out. App checks that you have permission to use it. There is also a form to guide you through registering to use the app."
	    },
    ],
    
	getLatestNews : function()
	{
		var latestNews = Ember.copy(this.model);
		latestNews = latestNews.splice(0,1);
		return latestNews;
	}
});
