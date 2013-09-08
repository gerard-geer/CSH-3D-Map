<?php require_once('php/main.php'); ?>
<!DOCTYPE html>
<html>
	<head>
		<title>CSH Floor Map</title>
		<link rel="stylesheet" type="text/css" href="css/map.css"/></link>	
		<script type="text/javascript" src="js/glMatrix-0.9.5.min.js"></script>
		<script type="text/javascript" src="js/jquery.js"></script>
		<script type="text/javascript" src="js/WebGLShader.js"></script>
		<script type="text/javascript" src="js/room.js"></script>
		<script type="text/javascript" src="js/Model3D.js"></script>
		<script type="text/javascript" src="js/WebGLFramebuffer.js"></script>
		<script type="text/javascript" src="js/WebGLFBRenderQuad.js"></script>
		<script type="text/javascript" src="js/floorMapModelDataAsJavascript.js"></script>
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
		
		<script id="sobelFrag" type="x-shader/x-fragment">
			precision highp float; // High precision so that we can sample very small distances when differentiating.
			uniform sampler2D diffableSampler;
			uniform sampler2D colorSampler;
			uniform int curRoomID;
			varying vec2 texCoord;
			float res = .0005;
			void main(void) {
				// Get a texel at the actual location within the diff texture.
				vec4 center = texture2D(diffableSampler, texCoord);
				// Sample pixels [res] distance from the actual current texture coordinate...
				vec4 top = texture2D(diffableSampler, vec2(texCoord.x, texCoord.y-res));
				vec4 bottom = texture2D(diffableSampler, vec2(texCoord.x, texCoord.y+res));
				vec4 left = texture2D(diffableSampler, vec2(texCoord.x-res, texCoord.y));
				vec4 right = texture2D(diffableSampler, vec2(texCoord.x+res, texCoord.y));
				// And take the absolute difference between them.
				vec4 sobel = abs(top-bottom) + abs(left-right);
				
				// If we have pretty much any difference,
				if(sobel.r > 1.0/256.0)
				{
					// We set our fragment colour to the line colour that we want.
					sobel = vec4(0.0, 1.0, 0.333, 1.0);
				}
				
				// If we are at the current room we highlight that shit.
				else if(int(256.00 * center.r) == curRoomID)
				{				
					sobel = texture2D(colorSampler, texCoord)+texture2D(colorSampler, texCoord);
				}
				// Otherwise we just set it to the colour of the texel rendered in the user-intended pass.
				else sobel = texture2D(colorSampler, texCoord);
				
				// Report our fragment colour.
				gl_FragColor = sobel;//texture2D(fbSampler, texCoord);
			}
		</script>

		<script id="sobelVert" type="x-shader/x-vertex">
			precision lowp float;	// Low precision because, hell, they're just verts.
			attribute vec3 vertPos; // incoming vertex position.
			attribute vec2 vertUV;	// incoming vertex texture coordinate.

			varying vec2 texCoord;	// Texture coordinate variable sent to the fragment shader.

			void main(void) {
				vec3 vert = vec3(vertPos);
				
				// Stretch the quad to the size of the screen.
				vert.x *= 2.0;
				vert.x -= 1.0;
				vert.y *= 2.0;
				vert.y -= 1.0;
				
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
		<div id="hud_outline">CSH 3D FLOOR MAP v0.1.6.0<br>Click and drag to move!<br>Hold shift, click, and drag to rotate!<br>Click a room to see some info about it!<br>Click a link in that info to be taken to that info!<br>Now with LDAP connectivity.</div>
		<div id="hud_info_popup"></div>
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
		</div>
		<div class="base_info" id="base_restroom">
			<p class="datum_container">Restroom: <p class="datum" id="name"></p></p>
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