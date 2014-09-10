function readSingleFile(evt)
{
	evt.stopPropagation();
	evt.preventDefault();

	if (typeof evt.dataTransfer === "undefined")
		var f = evt.target.files[0];
	else	
		var f = evt.dataTransfer.files[0];

	if (f) 
	{
		var r = new FileReader();
		
		r.onload = function(e) 
		{ 
			var contents = e.target.result;

			var controller = Refset.__container__.lookup("controller:refsets.upload");
			controller.send('uploadMemberList',contents);
		}
		
		r.readAsText(f);
	} 
	else 
	{ 
		alert("Failed to load file");
	}
}

function handleDragOver(evt) 
{
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}