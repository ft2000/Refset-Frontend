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
			controller.send('importFlatFile',contents);
		}
		
		r.readAsText(f);
	} 
	else 
	{ 
		var dropData = evt.dataTransfer.getData("text/plain").split('|');
		
		if (dropData.length)
		{
			var concept 					= {};
			concept.referencedComponentId 	= dropData[0];
			concept.description 			= dropData[1];
			
			var controller = Refset.__container__.lookup("controller:refsets.upload");
			controller.send('importSingleMember',concept);
		}
		else
		{
			alert("Failed to load file / import member");			
		}
	}
}

function handleDragOver(evt) 
{
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy';
}

function handleDragEnter(evt) 
{
	this.classList.add('over');
}

function handleDragLeave(evt) 
{
	try {
	    if(evt.relatedTarget == 3) return;
	} catch(err) {}
	
	if (typeof evt.relatedTarget.id === "undefined" && evt.target.id === "fileUploadDropZone") return;
	if (typeof evt.target.id === "undefined" && evt.relatedTarget.id === "fileUploadDropZone") return;
	
	this.classList.remove('over');
}