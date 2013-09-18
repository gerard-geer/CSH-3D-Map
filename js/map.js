// This isn't very clean code yet. It's about as redundant as a TPS report report.

function initContext()
{
	// Extract the canvas from the document.
	canvas = document.getElementById("map_canvas");
	
	// Update the initial canvas size to full occupancy.
	// Fuck lil' posers who don't like it big.
	canvas.width = window.innerWidth*canvasScale;
	canvas.height = window.innerHeight*canvasScale;
	
	// Register all our callbacks.
	hudOutline = document.getElementById("hud_outline");
	hudOutline.addEventListener('mousedown', mouseDownFunction, false);
	hudOutline.addEventListener('mouseup', mouseUpFunction, false);
	hudOutline.addEventListener('mousemove', mouseMoveFunction, false);
	canvas.addEventListener('mousedown', mouseDownFunction, false);
	canvas.addEventListener('mouseup', mouseUpFunction, false);
	canvas.addEventListener('mousemove', mouseMoveFunction, false);
	window.addEventListener('keydown', keyDownFunction, false);
	window.addEventListener('keyup', keyUpFunction, false);
	window.addEventListener('mousewheel', scrollWheelFunction, false);
	window.addEventListener('DOMMouseScroll', scrollWheelFunction, false);
	window.onkeypress = keyPressedFunction;
	
	// Register a callback to handle window resizing.
	// You know, so it stays big.
	window.onresize = function(event)
	{
		canvas.width = window.innerWidth*canvasScale;
		canvas.height = window.innerHeight*canvasScale;
	}
	
	// Try to get a WebGL context from it. If we can't, well, poop.
	try{
		glContext = canvas.getContext("experimental-webgl");
	}
	catch(e)
	{
		try{
		}
		catch(e){}
	}
	if(!glContext)
	{
		try{
		}
		catch(e){}
	}
	
	// Set the screen-blanking colour to black.
	glContext.clearColor(0.0, 0.0, 0.0, 1.0);
	
	// Enable depth testing.
	glContext.enable(glContext.DEPTH_TEST);
	
	// Store whether or not we have derivation capabilities on the GPU.
	normalSupported = glContext.getExtension("OES_standard_derivatives");
}

function initShaders()
{

	////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
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
	
	////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// If the current hardware supports the derivatives extension, we create the derivative shader.
	if(normalSupported)
	{
		normalPassProgram = createShaderProgram(glContext, "normalVert", "normalFrag");
		normalPassProgram.vertPosAttribute = glContext.getAttribLocation(normalPassProgram, "vertPos");	
		glContext.enableVertexAttribArray(normalPassProgram.vertPosAttribute);
		normalPassProgram.vertColorAttribute = glContext.getAttribLocation(normalPassProgram, "vertColor");
		glContext.enableVertexAttribArray(normalPassProgram.vertColorAttribute);
		normalPassProgram.pmatUniform = glContext.getUniformLocation(normalPassProgram, "pmat");
		normalPassProgram.mvmatUniform = glContext.getUniformLocation(normalPassProgram, "mvmat");
	}
	
	////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	depthPassProgram = createShaderProgram(glContext, "depthVert", "depthFrag");
	depthPassProgram.vertPosAttribute = glContext.getAttribLocation(depthPassProgram, "vertPos");	
	glContext.enableVertexAttribArray(depthPassProgram.vertPosAttribute);
	depthPassProgram.vertColorAttribute = glContext.getAttribLocation(depthPassProgram, "vertColor");
	glContext.enableVertexAttribArray(depthPassProgram.vertColorAttribute);
	depthPassProgram.pmatUniform = glContext.getUniformLocation(depthPassProgram, "pmat");
	depthPassProgram.mvmatUniform = glContext.getUniformLocation(depthPassProgram, "mvmat");
	
	////////////////////////////////////////////////////////////////////////////////////////////////////////////	
	
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
	// framebuffer.
	wireframePassProgram.diffableSampler = glContext.getUniformLocation(wireframePassProgram, "diffableSampler");
	wireframePassProgram.normalSampler = glContext.getUniformLocation(wireframePassProgram, "normalSampler");
	wireframePassProgram.depthSampler = glContext.getUniformLocation(wireframePassProgram, "depthSampler");
	wireframePassProgram.diffuseSampler = glContext.getUniformLocation(wireframePassProgram, "diffuseSampler");
	
	// Store the location of the current room ID uniform.
	wireframePassProgram.curIDUniform = glContext.getUniformLocation(wireframePassProgram, "curRoomID");
	
	////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	horizBlurProgram = createShaderProgram(glContext, "horizBlurVert", "horizBlurFrag");
	horizBlurProgram.vertPosAttribute = glContext.getAttribLocation(horizBlurProgram, "vertPos");	
	glContext.enableVertexAttribArray(horizBlurProgram.vertPosAttribute);
	horizBlurProgram.vertUVAttribute = glContext.getAttribLocation(horizBlurProgram, "vertUV");
	glContext.enableVertexAttribArray(horizBlurProgram.vertUVAttribute);
	horizBlurProgram.inputSampler = glContext.getUniformLocation(horizBlurProgram, "inputSampler");
	
	////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	vertBlurProgram = createShaderProgram(glContext, "vertBlurVert", "vertBlurFrag");
	vertBlurProgram.vertPosAttribute = glContext.getAttribLocation(vertBlurProgram, "vertPos");	
	glContext.enableVertexAttribArray(vertBlurProgram.vertPosAttribute);
	vertBlurProgram.vertUVAttribute = glContext.getAttribLocation(vertBlurProgram, "vertUV");
	glContext.enableVertexAttribArray(vertBlurProgram.vertUVAttribute);
	vertBlurProgram.inputSampler = glContext.getUniformLocation(vertBlurProgram, "inputSampler");
	
	////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	compositingPassProgram = createShaderProgram(glContext, "compositingVert", "compositingFrag");
	compositingPassProgram.vertPosAttribute = glContext.getAttribLocation(compositingPassProgram, "vertPos");	
	glContext.enableVertexAttribArray(compositingPassProgram.vertPosAttribute);
	compositingPassProgram.vertUVAttribute = glContext.getAttribLocation(compositingPassProgram, "vertUV");
	glContext.enableVertexAttribArray(compositingPassProgram.vertUVAttribute);
	compositingPassProgram.normalSampler = glContext.getUniformLocation(compositingPassProgram, "normalSampler");
	compositingPassProgram.depthSampler = glContext.getUniformLocation(compositingPassProgram, "depthSampler");
	compositingPassProgram.diffuseSampler = glContext.getUniformLocation(compositingPassProgram, "diffuseSampler");
	compositingPassProgram.gaussianSampler = glContext.getUniformLocation(compositingPassProgram, "gaussianSampler");
	compositingPassProgram.wireframeSampler = glContext.getUniformLocation(compositingPassProgram, "wireframeSampler");
}

function initFBsAndQuads()
{
	// Create the various framebuffers used to render each frame.
	idFramebuffer = new WGLFramebuffer(glContext, 1024, 1024);
	normalFramebuffer = new WGLFramebuffer(glContext, 1024, 1024);
	depthFramebuffer = new WGLFramebuffer(glContext, 1024, 1024);
	colorFramebuffer = new WGLFramebuffer(glContext, 1024, 1024);
	horizBlurFramebuffer = new WGLFramebuffer(glContext, 1024, 1024);
	vertBlurFramebuffer = new WGLFramebuffer(glContext, 1024, 1024);
	wireframeFramebuffer = new WGLFramebuffer(glContext, 1024, 1024);
	fbQuad = new FBRenderQuad(glContext);
}

function initModel()
{
	// Create the 3D model of the floor.
	idModel = new Model3D(glContext, idModelPosData, idModelColorData);
	colorModel = new Model3D(glContext, colorModelPosData, colorModelColorData);
}

function initTemp()
{
	var info = $("#hud_outline");
	info.append("<br>Current temperature: "+currentTemp+" F");
}

function degToRad(degreesX) {
    return degreesX * Math.PI / 180;
}

function performModelTransformations()
{
	// Reset the model view matrix so that we don't stack changes repeatedly.
	mat4.identity(mvmat);	
	
	mat4.rotate(pmat, degToRad(degreesY), [1, 0, 0]);
	mat4.translate(mvmat, [0, 0, camZ]);
	mat4.rotate(mvmat, degToRad(degreesX), [0, 1, 0]);
	mat4.translate(mvmat, [0, 0, -camZ]);
	mat4.translate(mvmat, [xTrans, yTrans, zTrans]);
}

function performCameraTransformations()
{
	mat4.rotate(mvmat, degToRad(30), [1, 0, 0]);
	mat4.rotate(mvmat, degToRad(degreesX), [0, 1, 0]);
}



function initWebGLComponents()
{
	
	// Call the initialization function of all the things!
	initContext();
	initShaders();
	initFBsAndQuads();
	//initTemp();
	initModel();
	rooms = loadRooms("rooms.xml");
	// Register a timed interval to draw a new frame every 1/60th of a second.
	// Janky, but it works.
	window.setInterval(renderFrame, 1000/60);	
}
	
