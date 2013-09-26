// The current frame count.
var framecount;

// The framebuffer in which the diffuse pass is rendered.
var diffuseFramebuffer;

// The Quad framebuffer in which the ID, normal, and depth passes are rendered.
var framebufferIND;

// The framebuffer in which the wire-frame pass is rendered.
var wireframeFramebuffer;

// The framebuffer into which the horizontal gauss pass is rendered.
var horizBlurFramebuffer;

// The framebuffer into which the vertical gauss pass is rendered.
var vertBlurFramebuffer;

// The framebuffer quad onto which we draw what is stored in any given framebuffer.
var fbQuad;

// Whether or not dFdx and dFdy are supported in the fragment shader on the current
// hardware.
var normalSupported = null;

// The shader program used to render the ID, normal, and depth passes (by way of MRT).
var shaderProgramIND;

// The shader program used to render the colour pass.
var diffusePassProgram;

// The shader program that is used to render the wire-frame visual.
var wireframePassProgram;

// The two shader programs that perform the Gaussian blur.
var horizBlurProgram;
var vertBlurProgram;

// The shader program used to render the final pass to the screen.
var compositingPassProgram;

// The 3D model that is colour coded for Sobel filtering.
var idModel;

// The 3D model that is colour coded to be seen by the user.
var colorModel;

// The canvas element that we are going to be rendering to.
var canvas;

// The canvas of the loading animation.
var loadingCanvas;

// The WebGL context that we will be extracting from the canvas.
var glContext;

// The 2D context that we will grab from the loading canvas.
var loadingContext;

// The array of room information objects.
var rooms;

// The model view matrix that is used to translate and rotate the scenes' geometry.
var mvmat = mat4.create();

// The perspective matrix that quantifies the view frustum.
var pmat = mat4.create();

// Canvas size scale factor.
var canvasScale = .975;

// The near and far clipping plane z-coordinates.
var zNear = 725;
var zFar = 2500;

// Loading events.
var canvasLoadedEvent	= new CustomEvent("canvasDoneLoading");
var shadersLoadedEvent	= new CustomEvent("shadersDoneLoading");
var buffersCreatedEvent	= new CustomEvent("buffersDoneLoading");
var modelsLoadedEvent	= new CustomEvent("modelsDoneLoading");
var roomsLoadedEvent	= new CustomEvent("roomsDoneLoading");
