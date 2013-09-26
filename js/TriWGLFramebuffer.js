function QuadWGLFramebuffer(wglContext, w, h)
{
	this.fb = wglContext.createFramebuffer();
	wglContext.bindFramebuffer(wglContext.FRAMEBUFFER, this.fb);
	
	this.fb.w = w;
	this.fb.h = h;
	
	this.fbtex = new Array(3);
	
	for(var i = 0; i < fbtex.length; i++)
	{
		this.fbtex[i] = wglContext.createTexture();
		wglContext.bindTexture(wglContext.TEXTURE_2D, this.fbtex[i]);
	
		// Set the magnification and minification filters for the texture. 
		wglContext.texParameteri(wglContext.TEXTURE_2D, wglContext.TEXTURE_MAG_FILTER, wglContext.NEAREST);
		wglContext.texParameteri(wglContext.TEXTURE_2D, wglContext.TEXTURE_MIN_FILTER, wglContext.LINEAR);
		
		wglContext.texParameteri(wglContext.TEXTURE_2D, wglContext.TEXTURE_WRAP_S, wglContext.MIRRORED_REPEAT);
		wglContext.texParameteri(wglContext.TEXTURE_2D, wglContext.TEXTURE_WRAP_T, wglContext.MIRRORED_REPEAT);
		
		wglContext.texImage2D(wglContext.TEXTURE_2D, 0, wglContext.RGB, this.fb.w, this.fb.h, 0, wglContext.RGB, wglContext.UNSIGNED_BYTE, null);
		
		// Attach the framebuffer texture to the framebuffer as its colour component.
		var attachment = null;
		switch(i){
			case 0: attachment = wglContext.COLOR_ATTACHMENT0; break;
			case 1: attachment = wglContext.COLOR_ATTACHMENT1; break;
			case 2: attachment = wglContext.COLOR_ATTACHMENT2; break;
		}
		wglContext.framebufferTexture2D(wglContext.FRAMEBUFFER, attachment, wglContext.TEXTURE_2D, this.fbtex[i], 0);
	}
	
	// Create the renderbuffer.
	this.rb = wglContext.createRenderbuffer();
	
	// Bind to it so we can set it up.
	wglContext.bindRenderbuffer(wglContext.RENDERBUFFER, this.rb);
	
	// Initialize the renderbuffer memory.
	wglContext.renderbufferStorage(wglContext.RENDERBUFFER, wglContext.DEPTH_COMPONENT16, this.fb.w, this.fb.h);
	
	// Attach the renderbuffer to the framebuffer as its depth component. You know, so we have a z.
	wglContext.framebufferRenderbuffer(wglContext.FRAMEBUFFER, wglContext.DEPTH_ATTACHMENT, wglContext.RENDERBUFFER, this.rb);
	
	// Unbind from all the things so that we don't accidentally modify them.
	wglContext.bindTexture(wglContext.TEXTURE_2D, null);
	wglContext.bindRenderbuffer(wglContext.RENDERBUFFER, null);
	wglContext.bindFramebuffer(wglContext.FRAMEBUFFER, null);
	
QuadWGLFramebuffer.prototype.use = function(wglContext)
{
	
	wglContext.bindFramebuffer(wglContext.FRAMEBUFFER, this.fb);
}

QuadWGLFramebuffer.prototype.stopUse = function(wglContext)
{
	wglContext.bindFramebuffer(wglContext.FRAMEBUFFER, null);
}

QuadWGLFramebuffer.prototype.getTex = function(index)
{
	return this.fbtex[index];
}
		
	
	