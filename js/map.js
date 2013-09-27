// This isn't very clean code yet. It's about as redundant as a TPS report report.

function initContext()
{
	// Extract the canvas from the document.
	canvas = document.getElementById("map_canvas");
	
	// Update the initial canvas size to full occupancy.
	// Fuck lil' posers who don't like it big.
	canvas.width = window.innerWidth*canvasScale;
	canvas.height = window.innerHeight*canvasScale;
	
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
	
	// Initialize the frame counter.
	framecount = 0.0;
}

function initPageElements()
{
	// Register all our callbacks.
	canvas.addEventListener('mousedown', mouseDownFunction, false);
	canvas.addEventListener('mouseup', mouseUpFunction, false);
	canvas.addEventListener('mousemove', mouseMoveFunction, false);
	canvas.addEventListener("webglcontextlost", onContextLost, false);
	canvas.addEventListener("webglcontextrestored", onContextRestored, false);
	$("#map_container").on("contextmenu", function(e){e.preventDefault();}, false);
	window.addEventListener('keydown', keyDownFunction, false);
	window.addEventListener('keyup', keyUpFunction, false);
	window.addEventListener('mousewheel', scrollWheelFunction, false);
	window.addEventListener('DOMMouseScroll', scrollWheelFunction, false);
	window.onkeypress = keyPressedFunction;
	document.addEventListener("canvasDoneLoading", function(event){drawLoadingBar(.2);}, false);
	document.addEventListener("shadersDoneLoading", function(event){drawLoadingBar(.4);}, false);
	document.addEventListener("buffersDoneLoading", function(event){drawLoadingBar(.6);}, false);
	document.addEventListener("modelsDoneLoading", function(event){drawLoadingBar(.8);}, false);
	document.addEventListener("roomsDoneLoading", function(event)
															{
																drawLoadingBar(1.0);
																$("#loading_canvas_container").fadeOut();
																$("#map_container").fadeIn();	
																$("#text").fadeIn();
															}, false);
	
	
	
	// Register a callback to handle window resizing.
	// You know, so it stays big.
	window.onresize = function(event)
	{
		canvas.width = window.innerWidth*canvasScale;
		canvas.height = window.innerHeight*canvasScale;
	}
	
	// Make the HUD info popup draggable using JQuery UI.
	$("#hud_info_popup").draggable();
	
}

function initShaders()
{
	// If the current hardware supports the derivatives extension, and the user wants it,
	// we create the derivative shader.
	if(normalSupported && !basicMode)
	{
		initNormalShader();
	}
	
	// We will never render a depth pass if we are in basic mode. We leave its framebuffer empty, untouched, virgin.
	if(!basicMode)
	{
		initDepthShader();
	}
	
	// We will also not need the blur shader if we are in basic mode.
	if(!basicMode)
	{
		initBlurShaders();
	}
	
	// Initialize the rest of the shaders.
	initBaseShader();
	initWireframeShader();
	initCompositingShader();
}

function initFBsAndQuads()
{
	// Set up the resolution as specified.
	var res = 1024;
	var wireframeRes = 1024;
	if(lowRes)
	{
		res = 256;
		wireframeRes = 2048;
	}
	
	// Create the various framebuffers used to render each frame, according
	// to the mode used.
	if(basicMode)
	{
		normalFramebuffer = new WGLFramebuffer(glContext, 4, 4);
		horizBlurFramebuffer = new WGLFramebuffer(glContext, 4, 4);
		vertBlurFramebuffer = new WGLFramebuffer(glContext, 4, 4);
		depthFramebuffer = new WGLFramebuffer(glContext, 4, 4);
	}
	else
	{
		normalFramebuffer = new WGLFramebuffer(glContext, res, res);
		horizBlurFramebuffer = new WGLFramebuffer(glContext, res, res);
		vertBlurFramebuffer = new WGLFramebuffer(glContext, res, res);
		depthFramebuffer = new WGLFramebuffer(glContext, res, res);
	}
	idFramebuffer = new WGLFramebuffer(glContext, res, res);
	colorFramebuffer = new WGLFramebuffer(glContext, res, res);
	wireframeFramebuffer = new WGLFramebuffer(glContext, wireframeRes, wireframeRes);
	fbQuad = new FBRenderQuad(glContext);
}

function initModel()
{
	// Create the 3D model of the floor.
	idModel = new Model3D(glContext, idModelPosData, idModelColorData);
	colorModel = new Model3D(glContext, colorModelPosData, colorModelColorData);
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

function initLoadingCanvas()
{
	loadingCanvas  = document.getElementById("loading_canvas");
	loadingContext = loadingCanvas.getContext("2d");
	loadingContext.fillStyle = "black";
	loadingContext.fillRect(0, 0, loadingCanvas.width, loadingCanvas.height);
}

function drawLoadingBar(percentageComplete)
{
	loadingContext.fillStyle = "black";
	loadingContext.fillRect(0, 0, loadingCanvas.width, loadingCanvas.height);
	loadingContext.fillStyle = "green";
	loadingContext.fillRect(0, 0, loadingCanvas.width*percentageComplete, loadingCanvas.height);
}
	


function initWebGLComponents()
{
	initLoadingCanvas();
	
	// Call the initialization functions of all the things, and dispatch events when each happens!
	initContext();
	initPageElements();
	document.dispatchEvent(canvasLoadedEvent);
	
	initShaders();
	document.dispatchEvent(shadersLoadedEvent);
	
	initFBsAndQuads();
	document.dispatchEvent(buffersCreatedEvent);
	
	initModel();
	document.dispatchEvent(modelsLoadedEvent);
	
	rooms = loadRooms("rooms.xml");
	document.dispatchEvent(roomsLoadedEvent);
	
	// Register a timed interval to draw a new frame every 1/60th of a second.
	// Janky, but it works.
	window.setInterval(renderFrame, 1000/60);	
}

	
