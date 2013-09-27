function initBaseShader()
{
	// Create the shader that will be used to render the original pass onto the
	// framebuffer.
	baseRenderProgram = createShaderProgram(glContext, "idVert", "idFrag");
	
	// Store the location within the shader of its vertex position entry point.
	baseRenderProgram.vertPosAttribute = glContext.getAttribLocation(baseRenderProgram, "vertPos");	
	// Enable the use of this entry point.
	glContext.enableVertexAttribArray(baseRenderProgram.vertPosAttribute);
	
	// We also store the location of the colour data entry point...
	baseRenderProgram.vertColorAttribute = glContext.getAttribLocation(baseRenderProgram, "vertColor");
	// ..and store it as well.
	glContext.enableVertexAttribArray(baseRenderProgram.vertColorAttribute);
	
	// Store the locations within the shader of the two transformation matrices.
	baseRenderProgram.pmatUniform = glContext.getUniformLocation(baseRenderProgram, "pmat");
	baseRenderProgram.mvmatUniform = glContext.getUniformLocation(baseRenderProgram, "mvmat");
}

function initNormalShader()
{
	// Create the shader using the appropriate source.
	normalPassProgram = createShaderProgram(glContext, "normalVert", "normalFrag");
	glContext.useProgram(normalPassProgram);
	// Store the attribute location to send vertex data to.
	normalPassProgram.vertPosAttribute = glContext.getAttribLocation(normalPassProgram, "vertPos");	

	// Enable that location for use.
	glContext.enableVertexAttribArray(normalPassProgram.vertPosAttribute);

	// Store the attribute location to send vertex colour data to.
	normalPassProgram.vertColorAttribute = glContext.getAttribLocation(normalPassProgram, "vertColor");

	// Enable the use of this attribute location as well.
	glContext.enableVertexAttribArray(normalPassProgram.vertColorAttribute);

	// Store the location of the perspective and model-view matrix uniforms.
	normalPassProgram.pmatUniform = glContext.getUniformLocation(normalPassProgram, "pmat");
	normalPassProgram.mvmatUniform = glContext.getUniformLocation(normalPassProgram, "mvmat");
	glContext.useProgram(null);
}

function initDepthShader()
{
	// Create the shader using the appropriate source.
	depthPassProgram = createShaderProgram(glContext, "depthVert", "depthFrag");
		
	// Store the attribute location to send vertex data to.
	depthPassProgram.vertPosAttribute = glContext.getAttribLocation(depthPassProgram, "vertPos");	
	
	// Enable that location for use.
	glContext.enableVertexAttribArray(depthPassProgram.vertPosAttribute);
		
	// Store the attribute location to send vertex colour data to.
	depthPassProgram.vertColorAttribute = glContext.getAttribLocation(depthPassProgram, "vertColor");
	
	// Enable this location as well.
	glContext.enableVertexAttribArray(depthPassProgram.vertColorAttribute);
	
	// Store the location of the perspective and model-view matrix uniforms.
	depthPassProgram.pmatUniform = glContext.getUniformLocation(depthPassProgram, "pmat");
	depthPassProgram.mvmatUniform = glContext.getUniformLocation(depthPassProgram, "mvmat");
}

function initWireframeShader()
{
	// Create the shader that will be used to render the framebuffer onto the framebuffer quad.
	wireframePassProgram = createShaderProgram(glContext, "wireframeVert", "wireframeFrag");
	
	// We store and enable the vertex position attribute and entry point for this shader as well.
	wireframePassProgram.vertPosAttribute = glContext.getAttribLocation(wireframePassProgram, "vertPos");
	glContext.enableVertexAttribArray(wireframePassProgram.vertPosAttribute);
	// However with this shader we don't have a vertex colour entry point and attribute; rather,
	// we have an entry point for texture coordinates to be fed in. This allows us to render
	// the framebuffer texture accurately.
	wireframePassProgram.vertUVAttribute = glContext.getAttribLocation(wireframePassProgram, "vertUV");
	glContext.enableVertexAttribArray(wireframePassProgram.vertUVAttribute);
	
	// Store the location of the framebuffer sampler uniforms so we can feed the texture data of the
	// various framebuffers used to draw the wire-frame.
	wireframePassProgram.diffableSampler = glContext.getUniformLocation(wireframePassProgram, "diffableSampler");
	wireframePassProgram.normalSampler = glContext.getUniformLocation(wireframePassProgram, "normalSampler");
	wireframePassProgram.depthSampler = glContext.getUniformLocation(wireframePassProgram, "depthSampler");
	wireframePassProgram.diffuseSampler = glContext.getUniformLocation(wireframePassProgram, "diffuseSampler");
	
	// Store the location of the current room ID uniform.
	wireframePassProgram.curIDUniform = glContext.getUniformLocation(wireframePassProgram, "curRoomID");
	
	// Store the location of the isRainbow uniform.
	wireframePassProgram.isRainbowUniform = glContext.getUniformLocation(wireframePassProgram, "isRainbow");
	
	// Store the location of the frame-count uniform.
	wireframePassProgram.framecountUniform = glContext.getUniformLocation(wireframePassProgram, "framecount");
}

function initBlurShaders()
{
	// Create the shader using the appropriate source.
	horizBlurProgram = createShaderProgram(glContext, "horizBlurVert", "horizBlurFrag");
		
	// Store the attribute location to send vert data to.
	horizBlurProgram.vertPosAttribute = glContext.getAttribLocation(horizBlurProgram, "vertPos");	
	
	// Enable that location for use.
	glContext.enableVertexAttribArray(horizBlurProgram.vertPosAttribute);
	
	// Store the attribute location so that we can pump in texture coordinates.
	horizBlurProgram.vertUVAttribute = glContext.getAttribLocation(horizBlurProgram, "vertUV");
	
	// Enable this location as well. 
	glContext.enableVertexAttribArray(horizBlurProgram.vertUVAttribute);
	
	// Store the location of the input sampler--the sampler used to feed in the pre-blur image.
	horizBlurProgram.inputSampler = glContext.getUniformLocation(horizBlurProgram, "inputSampler");
	
	////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// Create the shader using the appropriate source.
	vertBlurProgram = createShaderProgram(glContext, "vertBlurVert", "vertBlurFrag");
		
	// Store the attribute location to send vert data to.
	vertBlurProgram.vertPosAttribute = glContext.getAttribLocation(vertBlurProgram, "vertPos");		
	
	// Enable that location for use.
	glContext.enableVertexAttribArray(vertBlurProgram.vertPosAttribute);
	
	// Store the attribute location so that we can pump in texture coordinates.
	vertBlurProgram.vertUVAttribute = glContext.getAttribLocation(vertBlurProgram, "vertUV");
	
	// Enable this location as well. 
	glContext.enableVertexAttribArray(vertBlurProgram.vertUVAttribute);
	
	// Store the location of the input sampler--the sampler used to feed in the pre-blur image.
	vertBlurProgram.inputSampler = glContext.getUniformLocation(vertBlurProgram, "inputSampler");
}

function initCompositingShader()
{
	// Create the shader using the appropriate source.
	compositingPassProgram = createShaderProgram(glContext, "compositingVert", "compositingFrag");
		
	// Store the attribute location to send vert data to.
	compositingPassProgram.vertPosAttribute = glContext.getAttribLocation(compositingPassProgram, "vertPos");
	
	// Enable that location for use.
	glContext.enableVertexAttribArray(compositingPassProgram.vertPosAttribute);
	
	// Store the attribute location so that we can pump in texture coordinates.
	compositingPassProgram.vertUVAttribute = glContext.getAttribLocation(compositingPassProgram, "vertUV");
	
	// Enable this location as well; always having to tell the GL state what to do and 
	// whatnot! Boy, I tell you WAHHHATTTT! MMMMHHHHHHMMMmmmph!
	glContext.enableVertexAttribArray(compositingPassProgram.vertUVAttribute);
	
	// Store the location of all the samplers used in the final composite so that we will be able to feed
	// the data from the corresponding framebuffers to the shader for use.
	compositingPassProgram.normalSampler = glContext.getUniformLocation(compositingPassProgram, "normalSampler");
	compositingPassProgram.depthSampler = glContext.getUniformLocation(compositingPassProgram, "depthSampler");
	compositingPassProgram.diffuseSampler = glContext.getUniformLocation(compositingPassProgram, "diffuseSampler");
	compositingPassProgram.gaussianSampler = glContext.getUniformLocation(compositingPassProgram, "gaussianSampler");
	compositingPassProgram.wireframeSampler = glContext.getUniformLocation(compositingPassProgram, "wireframeSampler");
}