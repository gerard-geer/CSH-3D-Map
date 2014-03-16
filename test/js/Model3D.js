function Model3D(wglContext, posBufferData, colorBufferData)
{
	// Create the position buffer of this 3D model.
	this.posBuffer = wglContext.createBuffer();
	// Bind to the buffer so that we can manipulate it.
	wglContext.bindBuffer(wglContext.ARRAY_BUFFER, this.posBuffer);
	// Feed the vertex position data to the buffer, storing it GPU side.
	wglContext.bufferData(wglContext.ARRAY_BUFFER, new Float32Array(posBufferData), wglContext.STATIC_DRAW);
	
	// Store various properties relating to the position buffer.
	this.posBuffer.itemSize = 3;
	this.posBuffer.items = posBufferData.length/3;
	
	// Now we create a buffer to store the vertex colour data of the model.
	this.colorBuffer = wglContext.createBuffer();
	
	// Bind to this new buffer so that it can be given data.
	wglContext.bindBuffer(wglContext.ARRAY_BUFFER, this.colorBuffer);
	
	// Store the vertex colour data on the GPU.
	wglContext.bufferData(wglContext.ARRAY_BUFFER, new Float32Array(colorBufferData), wglContext.STATIC_DRAW);
	
	// Store similar information about the colour buffer.
	this.colorBuffer.itemSize = 3;
	this.colorBuffer.items = colorBufferData.length/3;
	
	//console.log"POS BUFFER ITEMS: "+this.posBuffer.items+"\nCOLOR BUFFER ITEMS: "+this.colorBuffer.items);
}

Model3D.prototype.getPosBuffer = function()
{
	return this.posBuffer;
}

Model3D.prototype.getColorBuffer = function()
{
	return this.colorBuffer;
}
	
	
	
	