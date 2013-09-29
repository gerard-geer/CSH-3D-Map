/**
 THIS FILE CONTAINS ALL THE FUNCTIONS THAT CARRY OUT PER-FRAME RENDERING DUTIES.
*/

function startRendering()
{
	refreshInterval = window.clearInterval(refreshInterval);
	refreshInterval = window.setInterval(renderFrame, 1000.0/60.0);
	isRefresh = true;
}

function stopRendering()
{
	refreshInterval = window.clearInterval(refreshInterval);
	if(window.mozInnerScreenX)
	{
		log("USING FIREFOX");
		refreshInterval = window.setInterval(renderFrame, 1000.0);
	}
	isRefresh = false;
}

function setMatrixUniforms(program) 
{
	// Pass the values of the two transformation matrices to the ID Pass shader, so
	// that we can handle model transformations.
	glContext.uniformMatrix4fv(program.pmatUniform, false, pmat);
	glContext.uniformMatrix4fv(program.mvmatUniform, false, mvmat);
}

function renderModel(model, program, buffer, clearR, clearG, clearB)
{
	// Start using the specified program.
	glContext.useProgram(program);
	
	// Swap to the given framebuffer.
	if(buffer) buffer.use(glContext);
	
	// Set up the viewport to take advantage of all the pixels in the framebuffer texture.
	glContext.viewport(0, 0, buffer.getWidth(), buffer.getHeight());
	
	// Set the blanking colour.
	glContext.clearColor(clearR, clearG, clearB, 1.0);
	
	// Clear the screen of the previous frame.
	glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);
	
	mat4.identity(pmat);
	// Apply standard perspective transformations to the perspective matrix..
	mat4.perspective(45, canvas.width/canvas.height, zNear, zFar, pmat);
	
	performModelTransformations();
	
	// Render the floor map model. You know the drill.
	glContext.bindBuffer(glContext.ARRAY_BUFFER, model.getPosBuffer());
	glContext.vertexAttribPointer(baseRenderProgram.vertPosAttribute, model.getPosBuffer().itemSize, glContext.FLOAT, false, 0, 0);
	glContext.bindBuffer(glContext.ARRAY_BUFFER, model.getColorBuffer());
	glContext.vertexAttribPointer(baseRenderProgram.vertColorAttribute, model.getColorBuffer().itemSize, glContext.FLOAT, false, 0, 0);
	
	// Pass in values for the shader-program's matrix uniforms.
	setMatrixUniforms(program);
	
	// Draw the data in the vbos.
	glContext.drawArrays(glContext.TRIANGLES, 0, model.getPosBuffer().items);
	
	// Cease using the framebuffer.
	if(buffer) buffer.stopUse(glContext);
		
	// Stop using the program.
	glContext.useProgram(null);
		
}

function renderWireframePass()
{
	wireframeFramebuffer.use(glContext);
	// Clear the previous frame.
	glContext.clearColor(0.0, 0.0, 0.0, 1.0);
	glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);
	glContext.viewport(0, 0, wireframeFramebuffer.getWidth(), wireframeFramebuffer.getHeight());
	
	// Use the framebuffer quad shader.
	glContext.useProgram(wireframePassProgram);
	
	// Activate a texture unit to pass in the ID framebuffer texture.
	glContext.activeTexture(glContext.TEXTURE0);
	glContext.bindTexture(glContext.TEXTURE_2D, idFramebuffer.getTex());
	glContext.uniform1i(wireframePassProgram.diffableSampler, 0);
	
	// Activate another texture unit to pass in the differentiated-normal framebuffer texture.
	glContext.activeTexture(glContext.TEXTURE1);
	glContext.bindTexture(glContext.TEXTURE_2D, normalFramebuffer.getTex());
	glContext.uniform1i(wireframePassProgram.normalSampler, 1);
	
	// Activate a third texture unit to pass in the depth framebuffer texture.
	glContext.activeTexture(glContext.TEXTURE2);
	glContext.bindTexture(glContext.TEXTURE_2D, depthFramebuffer.getTex());
	glContext.uniform1i(wireframePassProgram.depthSampler, 2);
	
	// Activate a fourth texture unit to pass in the colour framebuffer texture.
	glContext.activeTexture(glContext.TEXTURE3);
	glContext.bindTexture(glContext.TEXTURE_2D, colorFramebuffer.getTex());
	glContext.uniform1i(wireframePassProgram.diffuseSampler, 3);
	
	// Give the shader the Id of the current room.
	glContext.uniform1i(wireframePassProgram.curIDUniform, curRoom);
	
	// Give the shader the current frame count.
	glContext.uniform1f(wireframePassProgram.framecountUniform, framecount);
	
	// Give the shader the rainbow status.
	glContext.uniform1f(wireframePassProgram.isRainbowUniform, isRainbow ? 1.0 : 0.0);
	
	// Draw the quad. 
	fbQuad.render(glContext, wireframePassProgram);
	
	// Stop using the framebuffer quad shader.
	glContext.useProgram(null);
	
	wireframeFramebuffer.stopUse(glContext);
}

function renderPartialBlurPass(buffer_in, buffer_out, program)
{
	// Start rendering to the buffer that we are rendering out to.
	buffer_out.use(glContext);
	
	// Set the blanking colour to the colour we want.
	glContext.clearColor(0.0, 0.0, 0.0, 1.0);
	
	// Set up the viewport to take advantage of all the pixels in the framebuffer texture.
	glContext.viewport(0, 0, buffer_out.getWidth(), buffer_out.getHeight());
	
	// Blank the buffer of the last frame.
	glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);
	
	// Ensure that we use the specified shader program.
	glContext.useProgram(program);
	
	// Activate a texture unit to pass in the wire-frame framebuffer texture.
	glContext.activeTexture(glContext.TEXTURE0);
	glContext.bindTexture(glContext.TEXTURE_2D, buffer_in.getTex());
	glContext.uniform1i(program.inputSampler, 0);
	
	// Draw the framebuffer quad with the specified shader (into the specified buffer. 
	fbQuad.render(glContext, program);
	
	// Stop using our given shader program.
	glContext.useProgram(null);
	
	// Stop rendering into the horizontal blurring framebuffer.
	buffer_out.stopUse(glContext);
}

function renderBlurPass()
{
	//HORIZONTAL PASS////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	renderPartialBlurPass(wireframeFramebuffer, horizBlurFramebuffer, horizBlurProgram);
	
	//VERTICAL PASS/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	renderPartialBlurPass(horizBlurFramebuffer, vertBlurFramebuffer, vertBlurProgram);
}
	
function renderCompositingPass()
{
	
	// Set the appropriate blanking color.
	glContext.clearColor(0.0, 0.0, 0.0, 1.0);
	
	// Clear the framebuffer.
	glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);
	
	// Use the appropriate shader program.
	glContext.useProgram(compositingPassProgram);
	
	// Set the viewport to fill exactly the number of pixels on screen.
	glContext.viewport(0, 0, canvas.width, canvas.height);
	
	// Pass in the framebuffer texture of the diffuse (user-visible coloured) rendering pass.
	glContext.activeTexture(glContext.TEXTURE0);
	glContext.bindTexture(glContext.TEXTURE_2D, colorFramebuffer.getTex());
	glContext.uniform1i(compositingPassProgram.diffuseSampler, 0);
	
	// Pass in the framebuffer texture of the differentiated-normal rendering pass.
	glContext.activeTexture(glContext.TEXTURE1);
	glContext.bindTexture(glContext.TEXTURE_2D, normalFramebuffer.getTex());
	glContext.uniform1i(compositingPassProgram.normalSampler, 1);
	
	// Pass in the framebuffer texture of the depth-revealing rendering pass.
	glContext.activeTexture(glContext.TEXTURE2);
	glContext.bindTexture(glContext.TEXTURE_2D, depthFramebuffer.getTex());
	glContext.uniform1i(compositingPassProgram.depthSampler, 2);
	
	// Pass in the framebuffer texture of the blurred wire-frame.
	glContext.activeTexture(glContext.TEXTURE3);
	glContext.bindTexture(glContext.TEXTURE_2D, vertBlurFramebuffer.getTex());
	glContext.uniform1i(compositingPassProgram.gaussianSampler, 3);
	
	// Pass in the framebuffer texture of the original wire-frame.
	glContext.activeTexture(glContext.TEXTURE4);
	glContext.bindTexture(glContext.TEXTURE_2D, wireframeFramebuffer.getTex());
	glContext.uniform1i(compositingPassProgram.wireframeSampler, 4);
	
	// Render the quad using the appropriate program.
	fbQuad.render(glContext, compositingPassProgram);
	
	// End our use of this program so we don't accidentally use it elsewhere.
	glContext.useProgram(null);
}

function renderFrame()
{
	// Call the stupid key pressed function because of how slow keyboard callbacks are.
	keyPressedFunction();
	
	//ID PASS///////////////////////////////////////////////////////////////////////////////
	
	renderModel(idModel, baseRenderProgram, idFramebuffer, 1.0, 1.0, 0.0);
	
	//COLOURED PASS/////////////////////////////////////////////////////////////////////////
	
	renderModel(colorModel, baseRenderProgram, colorFramebuffer, 0.0, 0.0, 0.0);
	
	//NORMALING PASS////////////////////////////////////////////////////////////////////////
	if(normalSupported && !basicMode)
	{
		renderModel(colorModel, normalPassProgram, normalFramebuffer, 1.0, 1.0, 1.0);
	}
	//DEPTH PASS////////////////////////////////////////////////////////////////////////////
	if(!basicMode)
	{
		renderModel(colorModel, depthPassProgram, depthFramebuffer, 1.0, 1.0, 1.0);
	}
	//WIREFRAME PASS////////////////////////////////////////////////////////////////////////
	
	renderWireframePass();
	
	//BLUR PASS/////////////////////////////////////////////////////////////////////////////
	if(!basicMode)
	{
		renderBlurPass();
	}
	//COMPOSITING PASS//////////////////////////////////////////////////////////////////////
	
	renderCompositingPass();
	
	//OTHER STUFF TO DO/////////////////////////////////////////////////////////////////////
	
	framecount += 1.0;
	if(framecount > 60.0*10000.0)framecount = 0.0;

}