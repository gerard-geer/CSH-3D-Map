function WGLFramebuffer(wglContext, w, h)
{
	// Create a blank framebuffer object.
	this.fb = wglContext.createFramebuffer();
	
	var data = new Array();
	for(var i = 0; i < w*h; i++)
	{
		data.push(0.0);
		data.push(0.0);
		data.push(1.0);
		data.push(1.0);
	}
	
	// Bind to our new framebuffer so that we can set it up for use.
	wglContext.bindFramebuffer(wglContext.FRAMEBUFFER, this.fb);
	
	// Store on our framebuffer object its intended width and height.
	this.fb.w = w;
	this.fb.h = h;
	//console.log"Framebuffer width: "+this.fb.w+"\nFramebuffer height: "+this.fb.h);
	
	// Create the framebuffer's texture.
	this.fbtex = wglContext.createTexture();
	
	// Bind to the texture so that we can set some of its properties.
	wglContext.bindTexture(wglContext.TEXTURE_2D, this.fbtex);
	
	// Set the magnification and minification filters for the texture. 
	wglContext.texParameteri(wglContext.TEXTURE_2D, wglContext.TEXTURE_MAG_FILTER, wglContext.NEAREST);
    wglContext.texParameteri(wglContext.TEXTURE_2D, wglContext.TEXTURE_MIN_FILTER, wglContext.LINEAR);
	
	wglContext.texParameteri(wglContext.TEXTURE_2D, wglContext.TEXTURE_WRAP_S, wglContext.MIRRORED_REPEAT);
	wglContext.texParameteri(wglContext.TEXTURE_2D, wglContext.TEXTURE_WRAP_T, wglContext.MIRRORED_REPEAT);
	
	// Create the texture data for the framebuffer texture.
	wglContext.texImage2D(wglContext.TEXTURE_2D, 0, wglContext.RGB, this.fb.w, this.fb.h, 0, wglContext.RGB, wglContext.UNSIGNED_BYTE, null);
	
	// Create the renderbuffer.
	this.rb = wglContext.createRenderbuffer();
	
	// Bind to it so we can set it up.
	wglContext.bindRenderbuffer(wglContext.RENDERBUFFER, this.rb);
	
	// Initialize the renderbuffer memory.
	wglContext.renderbufferStorage(wglContext.RENDERBUFFER, wglContext.DEPTH_COMPONENT16, this.fb.w, this.fb.h);
	
	// Attach the framebuffer texture to the framebuffer as its colour component.
	wglContext.framebufferTexture2D(wglContext.FRAMEBUFFER, wglContext.COLOR_ATTACHMENT0, wglContext.TEXTURE_2D, this.fbtex, 0);
	
	// Attach the renderbuffer to the framebuffer as its depth component. You know, so we have a z.
	wglContext.framebufferRenderbuffer(wglContext.FRAMEBUFFER, wglContext.DEPTH_ATTACHMENT, wglContext.RENDERBUFFER, this.rb);
	
	//console.log"IS FRAMEBUFFER GOOD? LET US CHECK: "+(wglContext.isFramebuffer(this.fb)));
	//console.log"IS RENDERBUFFER GOOD? LET US CHECK: "+(wglContext.isRenderbuffer(this.rb)));
	//console.log"IS FB TEXTURE GOOD? LET US CHECK: "+(wglContext.isTexture(this.fbtex)));
	
	// Unbind from all the things so that we don't accidentally modify them.
	wglContext.bindTexture(wglContext.TEXTURE_2D, null);
	wglContext.bindRenderbuffer(wglContext.RENDERBUFFER, null);
	wglContext.bindFramebuffer(wglContext.FRAMEBUFFER, null);
}

WGLFramebuffer.prototype.use = function(wglContext)
{
	wglContext.bindFramebuffer(wglContext.FRAMEBUFFER, this.fb);
}

WGLFramebuffer.prototype.stopUse = function(wglContext)
{
	wglContext.bindFramebuffer(wglContext.FRAMEBUFFER, null);
}

WGLFramebuffer.prototype.getTex = function()
{
	return this.fbtex;
}

WGLFramebuffer.prototype.getWidth = function()
{
	return this.fb.w;
}

WGLFramebuffer.prototype.getHeight = function()
{
	return this.fb.h;
}
	