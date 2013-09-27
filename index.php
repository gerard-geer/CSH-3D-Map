<?php require_once('php/main.php'); ?>
<!DOCTYPE html>
<html>
	<head>
		<title>CSH Floor Map</title>
		<link rel="stylesheet" type="text/css" href="css/map.css"/></link>
		<script type="text/javascript" src="js/glMatrix-0.9.5.min.js"></script>
		<script type="text/javascript">
			/*
				A cross-platform way to print out error messages.
			*/
			function log(msg) {
				setTimeout(function() {
					throw new Error(msg);
				}, 0);
			}
		</script>
		<script type="text/javascript" src="js/jquery.js"></script>
		<script type="text/javascript" src="js/jquery-ui-1.10.3.custom.min.js"></script>
		<script type="text/javascript" src="js/WebGLShader.js"></script>
		<script type="text/javascript" src="js/room.js"></script>
		<script type="text/javascript" src="js/Model3D.js"></script>
		<script type="text/javascript" src="js/WebGLFramebuffer.js"></script>
		<script type="text/javascript" src="js/WebGLFBRenderQuad.js"></script>
		<script type="text/javascript" src="js/floorMapModelDataAsJavascript.js"></script>
		<script type="text/javascript" src="js/vars.js"></script>
		<script type="text/javascript" src="js/shaders.js"></script>
		<script type="text/javascript" src="js/rendering.js"></script>
		<script type="text/javascript" src="js/callbacks.js"></script>
		<script type="text/javascript" src="js/map.js"></script>		
		<script id="idFrag" type="x-shader/x-fragment">
			precision lowp float; // No two pixels are less than (4, 4, 4) different from each other.

			varying vec4 vColor;	// The vertex colour received from the vertex shader, interpolated
									// to the current fragment coordinate.

			void main(void) {
				// Simply set the vertex colour to the one received. The ID pass is easy.
				gl_FragColor = vColor;
			}
		</script>

		<script id="idVert" type="x-shader/x-vertex">
			precision lowp float;	// Low precision for speed and because vertex positions don't really matter here.
			attribute vec3 vertPos; // Incoming vertex position.
			attribute vec4 vertColor;	// Incoming vertex colour.

			uniform mat4 mvmat;	// Model view matrix, used to typify geometry transformations.
			uniform mat4 pmat;	// The perspective matrix, used to quantify the view frustum.

			varying vec4 vColor; // Outgoing vertex colour, sent to the fragment shader after interpolation.

			void main(void) {
				// Transform the incoming vertex position by the transformation matrices and report it.
				gl_Position = pmat * mvmat * vec4(vertPos, 1.0);
				// Copy the incoming vertex colour data to the outgoing vertex colour variable.
				vColor = vertColor;
			}
		</script>
		
		<script id="normalFrag" type="x-shader/x-fragment">
			#extension GL_OES_standard_derivatives : require	// sht srs yo.
			
			precision highp float; // High precision because we can.

			void main(void) {
				// THIS LINE IS JIZZ CAKE. SURFACE NORMALS IN 1 LINE.
				vec3 n = normalize( vec3(dFdx(gl_FragCoord.z), dFdy(gl_FragCoord.z), 0) );
				// Make sure that we don't have any negative colour channels.
				n.xy = (n.xy/2.0)+.5;
				gl_FragColor = vec4( n, 1.0);
			}
		</script>

		<script id="normalVert" type="x-shader/x-vertex">
			precision highp float;	// high precision since we are relying on minute differences between interpolations.
			attribute vec3 vertPos; // Incoming vertex position.
			attribute vec4 vertColor;	// Incoming vertex colour.

			uniform mat4 mvmat;	// Model view matrix, used to typify geometry transformations.
			uniform mat4 pmat;	// The perspective matrix, used to quantify the view frustum.
			
			void main(void) {
				vec4 color = vertColor;	// Play with the colour attribute so the compiler doesn't discard it.
				// Transform the incoming vertex position by the transformation matrices and report it.
				gl_Position = pmat * mvmat * vec4(vertPos, 1.0);
			}
		</script>
		
		<script id="depthFrag" type="x-shader/x-fragment">
			precision highp float; // High precision because we can.
			
			void main(void) {
				// Output the fraction of the depth of the scene this fragment is set.
				// We the depth to a power to get more resolution close up.
				gl_FragColor = vec4( vec3(pow(gl_FragCoord.z, .6666)), 1 );
			}
		</script>

		<script id="depthVert" type="x-shader/x-vertex">
			precision highp float;	// high precision since we are relying on minute differences between interpolations.
			attribute vec3 vertPos; // Incoming vertex position.
			attribute vec4 vertColor;	// Incoming vertex colour.

			uniform mat4 mvmat;	// Model view matrix, used to typify geometry transformations.
			uniform mat4 pmat;	// The perspective matrix, used to quantify the view frustum.
			
			void main(void) {
				vec4 color = vertColor;	// Play with the colour attribute so the compiler doesn't discard it.
				// Transform the incoming vertex position by the transformation matrices and report it.
				gl_Position = pmat * mvmat * vec4(vertPos, 1.0);
			}
		</script>
		
		<script id="wireframeFrag" type="x-shader/x-fragment">
			precision lowp float; // High precision so that we can sample very small distances when differentiating.
			
			uniform sampler2D diffableSampler;	// The sampler that contains the ID pass.
			uniform sampler2D normalSampler; 	// The sampler that contains the differentiated-normal pass.
			uniform sampler2D depthSampler;		// The sampler that contains the depth data about the model.
			uniform sampler2D diffuseSampler;	// The sampler that contains the user-visible pass.
			
			
			uniform int curRoomID;		// The colour-ID of the currently selected room. (For highlighting.)
			uniform float framecount;	// The current frame count.
			uniform float isRainbow;		// Whether or not to do the rainbow jig.
			
			varying vec2 texCoord;		// The texture coordinate ascribed to the current fragment.
			
			const float res = .0005;	// The normalized gap between texture2D calls in creating the wire-frame effect.
			const float edgeThresh_normal = .008;// The threshold difference for what constitutes an edge in the normal sampler.
			const float edgeThresh_depth = .0105;// The threshold difference for what constitutes an edge in the depth sampler.
			const float edgeThresh_id = .004;	 // The threshold difference for what constitutes an edge in the ID sampler.
			
			vec4 wireframeColor = vec4(.1, .9, .2, 1.0);// The colour of the wire-frame, stored as an RGBA vector.
			
			// Returns the Sobel-differentiated result of a given texture.
			//
			// tex  (sampler2D)	: The texture object sampler to sample. (Fun with words)
			// l	(vec2)		: The texture coordinate to sample around.
			// d	(float)		: The distance with which to sample points in the texture.
			vec4 getSobel(sampler2D tex, vec2 l, float d)
			{
				// Sample from above, below, and adjacent to the current location and return the absolute difference.
				return 	abs( texture2D(tex, vec2(l.x, l.y-d)) - texture2D(tex, vec2(l.x, l.y+d)) ) +	// Vertical sampling
						abs( texture2D(tex, vec2(l.x-d, l.y)) - texture2D(tex, vec2(l.x+d, l.y)) );		// Horizontal sampling
			}
			
			void main(void) {
				// Get a texel at the actual location within the user-colour framebuffer texture
				// for final display.
				vec4 outputColor = vec4(0.0);
				
				// Get a texel at the actual location within the differentiable framebuffer to
				// check the current RoomID against.
				vec4 fragID = texture2D(diffableSampler, texCoord);
				
				// Get a Sobel differentiated texel from the ID pass to use in marking the borders between rooms.
				vec4 idSobel = getSobel(diffableSampler, texCoord, res);
				
				// Get another differentiated texel from the depth pass to highlight corners along parallel faces.
				vec4 depthSobel = getSobel(depthSampler, texCoord, res);
				
				// We do the same with the Normal pass, but since we
				// might not always be able to perform that pass, we have
				// to do some checking.
				vec4 normalSobel = getSobel(normalSampler, texCoord, res);
				
				// Handle the rainbow. Taste the rainbow.
				wireframeColor = ( ( 1.0-step(0.999, isRainbow) )*wireframeColor ) + step(.999, isRainbow)*vec4( 
					pow( sin((framecount/600.0)+texCoord.x), 2.0 ), 
					pow( sin((framecount/600.0)+.785+texCoord.y), 2.0 ), 
					pow( cos((framecount/600.0)+ texCoord.x*texCoord.y), 2.0 ),  
					1.0);
				
				// To make if-greater-than logic happen outside of conditionality, we must use the step function,
				// which returns 0.0 if the second parameter is less than the first, and 1.0 if otherwise.
				float hasWireframe = step(1.0, step(edgeThresh_id, idSobel.r)+	// we check to see if any Sobel result is
										step(edgeThresh_normal, normalSobel.r)+	// greater than its corresponding threshold,
										step(edgeThresh_normal, normalSobel.g)+ // and add the results. We then send this to
										step(edgeThresh_depth, depthSobel.r));  // the outer step function, which checks to
																				// see if we have an edge. We multiply this
				outputColor = 			wireframeColor*hasWireframe;			// result by the edge colour to get a wire in the frame.	
					
				// To test equality without comparison, we multiply by the inverse of the absolute value of the sign of
				// the ID fragment minus the value of the current ID.
				int i_fragID = int(fragID.r*256.0);
				outputColor += texture2D(diffuseSampler, texCoord)*	// Add the diffuse texel...
				(1.0-abs( sign( float(curRoomID) - float(i_fragID) ) )) // if the texel from the ID buffer matches the ID...
				*(1.0-hasWireframe);									// and if we don't already have wire-frame.
				
				// Report our final fragment colour.
				gl_FragColor = outputColor;
			}
		</script>

		<script id="wireframeVert" type="x-shader/x-vertex">
			precision lowp float;	// Low precision because, hell, they're just verts.
			attribute vec3 vertPos; // incoming vertex position.
			attribute vec2 vertUV;	// incoming vertex texture coordinate.

			varying vec2 texCoord;	// Texture coordinate variable sent to the fragment shader.

			void main(void) {
				vec3 vert = vec3(vertPos);
				
				// Stretch the quad to the size of the screen.
				vert.xy *= 2.0;
				vert.xy -= 1.0;
				
				// Pass along the UV coordinate, interpolating it by way of using varying variable.
				texCoord = vertUV;
				
				// Report the final transformed location of this vertex to the GL state.
				gl_Position = vec4(vert, 1.0);
			}
		</script>
		
		<script id="horizBlurFrag" type="x-shader/x-fragment">
			precision highp float; 	// High precision because we can.
			
			varying vec2 texCoord;	// Texture coordinate variable sent from the vertex shader.
			uniform sampler2D inputSampler;	// The sampler that contains the original wire-frame render.
			
			// Blur spread factor.
			const float sizeFactor = 3.0;
			const float strengthFactor = 0.9;
			
			void main(void) {
				gl_FragColor = vec4(0.0);
				// Accumulate a Gaussian distribution on the current fragment along the horizontal axis.
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(-0.00175*sizeFactor, 0.0))*strengthFactor*0.0044299121055113265;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(-0.00150*sizeFactor, 0.0))*strengthFactor*0.00895781211794;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(-0.00125*sizeFactor, 0.0))*strengthFactor*0.0215963866053;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(-0.00100*sizeFactor, 0.0))*strengthFactor*0.0443683338718;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(-0.00075*sizeFactor, 0.0))*strengthFactor*0.0776744219933;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(-0.00050*sizeFactor, 0.0))*strengthFactor*0.115876621105;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(-0.00025*sizeFactor, 0.0))*strengthFactor*0.147308056121;
				gl_FragColor += texture2D(inputSampler, texCoord         	        			 )*strengthFactor*0.159576912161;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2( 0.00025*sizeFactor, 0.0))*strengthFactor*0.147308056121;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2( 0.00050*sizeFactor, 0.0))*strengthFactor*0.115876621105;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2( 0.00075*sizeFactor, 0.0))*strengthFactor*0.0776744219933;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2( 0.00100*sizeFactor, 0.0))*strengthFactor*0.0443683338718;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2( 0.00125*sizeFactor, 0.0))*strengthFactor*0.0215963866053;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2( 0.00150*sizeFactor, 0.0))*strengthFactor*0.00895781211794;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2( 0.00175*sizeFactor, 0.0))*strengthFactor*0.0044299121055113265;
			}
		</script>

		<script id="horizBlurVert" type="x-shader/x-vertex">
			precision lowp float;	// Low precision because, hell, they're just verts.
			attribute vec3 vertPos; // incoming vertex position.
			attribute vec2 vertUV;	// incoming vertex texture coordinate.

			varying vec2 texCoord;			// Texture coordinate variable sent to the fragment shader.

			void main(void) {
				vec3 vert = vec3(vertPos);
				
				// Stretch the quad to the size of the screen.
				vert.xy *= 2.0;
				vert.xy -= 1.0;
				
				// Pass along the UV coordinate, interpolating it by way of using varying variable.
				texCoord = vertUV;
				
				// Report the final transformed location of this vertex to the GL state.
				gl_Position = vec4(vert, 1.0);
			}
		</script>
		
		<script id="vertBlurFrag" type="x-shader/x-fragment">
			precision highp float; // High precision because we can.
			
			varying vec2 texCoord;			// Texture coordinate variable sent from the vertex shader.
			uniform sampler2D inputSampler; // A sampler containing the horizontal blur result.
	
			const float sizeFactor = 3.0;
			const float strengthFactor = 0.9;
			
			void main(void) {
				gl_FragColor = vec4(0.0);
				// Accumulate the same sum along the Y axis.
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(0.0, -0.00175*sizeFactor))*strengthFactor*0.0044299121055113265;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(0.0, -0.00150*sizeFactor))*strengthFactor*0.00895781211794;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(0.0, -0.00125*sizeFactor))*strengthFactor*0.0215963866053;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(0.0, -0.00100*sizeFactor))*strengthFactor*0.0443683338718;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(0.0, -0.00075*sizeFactor))*strengthFactor*0.0776744219933;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(0.0, -0.00050*sizeFactor))*strengthFactor*0.115876621105;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(0.0, -0.00025*sizeFactor))*strengthFactor*0.147308056121;
				gl_FragColor += texture2D(inputSampler, texCoord     			    		 	 )*strengthFactor*0.159576912161;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(0.0,  0.00025*sizeFactor))*strengthFactor*0.147308056121;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(0.0,  0.00050*sizeFactor))*strengthFactor*0.115876621105;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(0.0,  0.00075*sizeFactor))*strengthFactor*0.0776744219933;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(0.0,  0.00100*sizeFactor))*strengthFactor*0.0443683338718;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(0.0,  0.00125*sizeFactor))*strengthFactor*0.0215963866053;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(0.0,  0.00150*sizeFactor))*strengthFactor*0.00895781211794;
				gl_FragColor += texture2D(inputSampler, texCoord + vec2(0.0,  0.00175*sizeFactor))*strengthFactor*0.0044299121055113265;
			}
		</script>

		<script id="vertBlurVert" type="x-shader/x-vertex">
			precision lowp float;	// Low precision because, hell, they're just verts.
			attribute vec3 vertPos; // incoming vertex position.
			attribute vec2 vertUV;	// incoming vertex texture coordinate.

			varying vec2 texCoord;	// Texture coordinate variable sent to the fragment shader.

			void main(void) {
				vec3 vert = vec3(vertPos);
				
				// Stretch the quad to the size of the screen.
				vert.xy *= 2.0;
				vert.xy -= 1.0;
				
				// Pass along the UV coordinate, interpolating it by way of using varying variable.
				texCoord = vertUV;
				
				// Report the final transformed location of this vertex to the GL state.
				gl_Position = vec4(vert, 1.0);
			}
		</script>
		
		<script id="compositingFrag" type="x-shader/x-fragment">
			precision lowp float;	// We aren't actually doing any testing here, 
									// so we don't need the extra precision.
			
			varying vec2 texCoord;	// The interpolated texture coordinate.

			uniform sampler2D normalSampler;	// The sampler that contains the differentiated-normal pass.
			uniform sampler2D depthSampler;		// The sampler that contains the depth data about the model.
			uniform sampler2D diffuseSampler;	// The sampler that contains the user-visible pass.
			uniform sampler2D gaussianSampler;	// The sampler that contains the blurred wire-frame and highlight pass.
			uniform sampler2D wireframeSampler; // The sampler that contains the wire-frame rendering.
			
			
			vec4 setScanline(vec2 coord, vec4 existingFrag, float strength)
			{
				return existingFrag * clamp(pow(sin(coord.y*1024.0), 2.0)+(1.0-strength), 0.0, 1.0);
			}
			
			void main(void) {
				gl_FragColor = 	texture2D(wireframeSampler, texCoord) + 
								texture2D(gaussianSampler, texCoord) + 
								texture2D(diffuseSampler, texCoord);
			}
		</script>

		<script id="compositingVert" type="x-shader/x-vertex">
			precision lowp float;	// Low precision because, hell, they're just verts.
			attribute vec3 vertPos; // incoming vertex position.
			attribute vec2 vertUV;	// incoming vertex texture coordinate.

			varying vec2 texCoord;	// Texture coordinate variable sent to the fragment shader.

			void main(void) {
				vec3 vert = vec3(vertPos);
				
				// Stretch the quad to the size of the screen.
				vert.xy *= 2.0;
				vert.xy -= 1.0;
				
				// Flip the texture because fuck.
				texCoord = vec2(vertUV.x, 1.0-vertUV.y);
				
				// Report the final transformed location of this vertex to the GL state.
				gl_Position = vec4(vert, 1.0);
			}
		</script>
	</head>
	
	<body onload="initWebGLComponents();">
		<div id="map_container">
			<canvas id="map_canvas" onmouseup="mouseUpFunction(this)" onmousemove="mouseMoveFunction(this)" width="1003" height="806"></canvas>
		</div>
		<div id="loading_canvas_container">
			<canvas id="loading_canvas" width="400" height="100"></canvas>
		</div>
		<div id="text">
			<h1>CSH 3D Floor Map</h1>
				Left-click and drag to move.
			<br>Right-click and drag to rotate.
			<br>Click a room for info about it.
			<br>The info pop-up is now draggable,
			<br>and links open within the map.
			<br>
			<br>
		</div>
		<div id="subtle_links">
			<script>
			if(!basicMode){
				document.write("<a class=\"subtle_link\" href=\"?basicMode=yes\">Framerate issues?</a>");
			}
			</script>
			<a class="subtle_link" href="https://github.com/Hamneggs/CSH-3D-Map">Github repo</a>
		</div>
		<div id="hud_info_popup"></div>
		<iframe id="webpage_popup" name="webpage_popup" sandbox="allow-pointer-lock allow-same-origin allow-forms allow-scripts allow-top-navigation allow-popups" src="" height=400 width=400 seamless></iframe>
		<div class="base_info" id="base_res_room">
			<p class="datum_container">Room #: <p class="datum" id="name"></p></p>
			<p class="datum_container">Resident: <p class="datum" id="res_a"></p></p>
			<p class="datum_container">Year: <p class="datum" id="res_a_year"></p></p>
			<p class="datum_container" id="qualificationsA">Qualifications: <p class="datum" id="res_a_qualifications"></p></p>
			<p class="datum_container">Info: <p class="datum" id="res_a_link"></p></p>
			<p class="datum_container">Resident: <p class="datum" id="res_b"></p></p>
			<p class="datum_container">Year: <p class="datum" id="res_b_year"></p></p>
			<p class="datum_container" id="qualificationsB">Qualifications: <p class="datum" id="res_b_qualifications"></p></p>
			<p class="datum_container">Info: <p class="datum" id="res_b_link"></p></p>
		</div>
		<div class="base_info" id="base_spec_room">
			<p class="datum_container">Room: <p class="datum" id="name"></p></p>
			<p class="datum_container">Info: <p class="datum" id="room_link"></p></p>
			<p class="datum_container">Relevant E-Board: <p class="datum" id="eboard"></p></p>
			<p class="datum_container">EBoard info: <p class="datum" id="eb_link"></p></p>
			<p class="datum_container">Lock: <p class="datum" id="doorlock"></p></p>
		</div>
		<div class="base_info" id="base_restroom">
			<p class="datum_container">Restroom: <p class="datum" id="name"></p></p>
			<p class="datum_container">SOAP: <p class="datum" id="soap"></p></p>
			<p class="datum_container">Coed?: <p class="datum" id="coed"></p></p>
		</div>
		<div class="base_info" id="base_stairs">
			<p class="datum_container">Stairwell: <p class="datum" id="name"></p></p>
			<p class="datum_container">Exits to: <p class="datum" id="exit_to"></p></p>
		</div>
		<div class="base_info" id="base_facilities">
			<p class="datum_container">Name: <p class="datum" id="name"></p></p>
		</div>
		<div class="base_info" id="base_utilities">
			<p class="datum_container">Name: <p class="datum" id="name"></p></p>
		</div>
		<div class="base_info" id="base_net_room">
			<p class="datum_container">Name: <p class="datum" id="name"></p></p>		
		</div>
		<div class="base_info" id="base_elevator">
			<p class="datum_container">Elevator: <p class="datum" id="name"></p></p>	
			<p class="datum_container">Harold: <p class="datum" id="harold"></p></p>	
		</div>
		<div class="base_info" id="base_project">
			<p class="datum_container">Project: <p class="datum" id="name"></p></p>
			<p class="datum_container">Info: <p class="datum" id="link"></p></p>
		</div>
		<div class="base_info" id="base_other">
			<p class="datum_container">Hmm?: <p class="datum" id="name"></p></p>
		</div>
		</body>
</html>