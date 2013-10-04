function WGLCubemap(wglContext, imgTop, imgBottom, imgLeft, imgRight, imgBack, imgFront)
{
	// Create a texture handle in the current WGL context.
	this.tex = wglContext.createTexture();
	
	// Bind to the texture and configure various properties of it.
	wglContext.bindTexture(wglContext.TEXTURE_CUBE_MAP, this.tex);
    wglContext.texParameteri(wglContext.TEXTURE_CUBE_MAP, wglContext.TEXTURE_WRAP_S, wglContext.CLAMP_TO_EDGE);
    wglContext.texParameteri(wglContext.TEXTURE_CUBE_MAP, wglContext.TEXTURE_WRAP_T, wglContext.CLAMP_TO_EDGE);
    wglContext.texParameteri(wglContext.TEXTURE_CUBE_MAP, wglContext.TEXTURE_MIN_FILTER, wglContext.LINEAR);
    wglContext.texParameteri(wglContext.TEXTURE_CUBE_MAP, wglContext.TEXTURE_MAG_FILTER, wglContext.LINEAR);
	
	// Create an array to bind images to faces.
	var faces = [[imgTop,		wglContext.TEXTURE_CUBE_MAP_POSITIVE_X],
                 [imgBottom,	wglContext.TEXTURE_CUBE_MAP_NEGATIVE_X],
                 [imgLeft,	 	wglContext.TEXTURE_CUBE_MAP_POSITIVE_Y],
                 [imgRight,	 	wglContext.TEXTURE_CUBE_MAP_NEGATIVE_Y],
                 [imgBack,		wglContext.TEXTURE_CUBE_MAP_POSITIVE_Z],
                 [imgFront,		wglContext.TEXTURE_CUBE_MAP_NEGATIVE_Z]];
			
	// For each face...
	for (var i = 0; i < faces.length; i++) {
		// Store the symbolic constant representing the face...
        var face = faces[i][1];
		// Create an empty image...
        var image = new Image();
		
		// Set the onload function, and give it default parameters.
        image.onload = function(texture, face, image) {
            return function() {
                wglContext.bindTexture(wglContext.TEXTURE_CUBE_MAP, texture);
                wglContext.pixelStorei(wglContext.UNPACK_FLIP_Y_WEBGL, false);
                wglContext.texImage2D(face, 0, wglContext.RGBA, wglContext.RGBA, wglContext.UNSIGNED_BYTE, image);
            }
        } (this.tex, face, image);
		// Set the source of the image, causing it to be loaded, and the onload callback to be triggered.
        image.src = faces[i][0];
    }
}

WGLCubemap.prototype.getTex = function()
{
	return this.tex;
}