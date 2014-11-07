/*

deserialiseURLString: function(p)
{
	var ret = {}
	
	if (p !== null)
	{
		var seg = p.replace(/^\?/,'').split('&')
	    var len = seg.length, i = 0;
		for (;i<len;i++) {
			if (!seg[i]) { continue; }
			var s = seg[i].split('=');
			var v = App.Utilities.urldecode(s[1]);
			ret[s[0]] = /^\[^0]d+$/.test(v) ? Math.ceil(v) : v // If our value is an integer value then force it to be numeric rather than a string
			}
		}
		return ret;
	},
 
urldecode : function(str) 
{
	   return decodeURIComponent((str+'').replace(/\+/g, '%20'));
},

serialiseObject : function(object){
	
	var URLSerialisedData = "";
	for (var key in object) {
	    if (URLSerialisedData !== "") {
	    	URLSerialisedData += "&";
	    }
	    URLSerialisedData += key + "=" + object[key];
	}
	
	return URLSerialisedData
},


function sortStationsData(request, response ) 
{ 		
	if(request.term === "")
		return response(stations);

	var arr = $.map(stations, function(value) {
		
		var score = Math.max(LiquidMetal.score(value.n, request.term),LiquidMetal.score(value.c, request.term));

		if(score < 0.75)
			return null; // jQuery.map compacts null values - so we do not get null entries in our drop-down list
		
		if (value.g) 	score += 0.1;
		if (value.t)  	score += 0.05;
	
	    var regex = new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + request.term.replace(/([\^\$\(\)\[\]\{\}\*\.\+\?\|\\])/gi, "\\$1") + ")(?![^<>]*>)(?![^&;]+;)", "gi");
		
	    value.matchText = value.n
	   
	    if (value.c.length)
	    	value.matchText += ' (' + value.c + ')';
	    
	    value.matchText = value.matchText.replace(regex, "<strong>$1</strong>");
		
		return { 'value': value, 'score': score };
	});
	
	quick_sort(arr)
	
	arr = arr.concat(searchForPostcode(request.term))
	
  	return response( $.map(arr, function(value) { return  value.value; }) );
}  

	populateSearchForm: function()
    {
    	if (typeof App.searchData === "undefined")
    	{
    		var searchFormData = sessionStoreManager.getSessionVar('searchFormData');
    		if (typeof searchFormData !== "undefined")
    			App.searchData = App.Utilities.deserialiseURLString(searchFormData)
    	}
    },
    
    
					sessionStoreManager.setSessionVar('searchFormData',URLSerialisedData)
					
					
*/