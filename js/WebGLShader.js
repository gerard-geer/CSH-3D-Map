function getShaderSource(id) 
{
	// Extract the shader source out of the html document.
	var shaderScript = document.getElementById(id);
	
	// If there is no script, we simply return null.
	if (!shaderScript) {
		return null;
	}

	// Create a string to hold the contents of the shader.
	var str = "";
	
	// Get the first child of the shader element, which is simply a
	// list of the words in the source.
	var k = shaderScript.firstChild;
	
	// Extract the source and put it into the source string.
	while (k) {
		if (k.nodeType == 3) {
			str += k.textContent;
		}
		k = k.nextSibling;
	}

	// Return the shader source.
	return str;
}

function createShader(wglContext, source, type)
{
	// Create a temporary variable to store our new shader object.
	var shader;
	
	// If we have a valid type, we create the shader using it.
	if(type == wglContext.VERTEX_SHADER || type == wglContext.FRAGMENT_SHADER)
	{
		shader = wglContext.createShader(type);
	}
	else return null;
	
	// Pass the source into the shader.
	wglContext.shaderSource(shader, source);
	
	// Compile the shader.
	wglContext.compileShader(shader);
	
	// If shit goes down, we console.log the user.
	if (!wglContext.getShaderParameter(shader, wglContext.COMPILE_STATUS)) {
		try{
			console.log("Shader error log: \n"+wglContext.getShaderInfoLog(shader));
			console.log("End shader error log");
		}
		catch(e){}
		return null;
	}
	
	// Finally we return the complete shader object.
	return shader;
}

function createShaderProgram(wglContext, vertID, fragID)
{
	// Extract the source from the elements with the IDs given.
	var vertSource = getShaderSource(vertID);
	var fragSource = getShaderSource(fragID);
	
	// Load and compile our shader objects.
	var vert = createShader(wglContext, vertSource, wglContext.VERTEX_SHADER);
	var frag = createShader(wglContext, fragSource, wglContext.FRAGMENT_SHADER);
	
	// To begin we create a raw shader program.
	var program = wglContext.createProgram();
	
	// Check to make sure nothing has gone wrong.
	if(!program){
		try{
			console.log("Was not able to create empty shader program. Perhaps context is bad.");
		}
		catch(e){}
		return null;
	}
	
	// Attach both compiled shaders.
	wglContext.attachShader(program, vert);
	wglContext.attachShader(program, frag);
	
	// Link the program.
	wglContext.linkProgram(program);
	
	// Check one more time.
	if (!wglContext.getProgramParameter(program, wglContext.LINK_STATUS)) 
	{
		try{
			console.log("Could not attach and/or link shader program. Perhaps a shader object didn't compile.");
			console.log(wglContext.getProgramParameter(program, wglContext.ATTACHED_SHADERS));
		}
		catch(e){}
		return null;
	}
	
	// Return the linked program for use.
	return program;
}
	