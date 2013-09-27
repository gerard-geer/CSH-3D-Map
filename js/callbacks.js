
// A variable to store the current degreesX of rotation.
var degreesX = 30;
var degreesY = -40;

// Translation variables.
var xTrans = -200.0;
var yTrans = 800.0;
var zTrans = -950;

// Maximum translations bumper values.
var xMin = -1000, xMax = 1000;
var zMin = -1200, zMax = 1200;

// Camera variables.
var camX = 0;
var camY = 0;
var camZ = -1000;

// The current room ID.
var curRoom = 512; // Out of range, so we don't highlight anything when there isn't a room.

// Whether or not shift is pressed.
var shiftPressed = false;

var lPressed = false;
var rPressed = false;
var uPressed = false;
var dPressed = false;

// The current mouse position.
var curMouseX;
var curMouseY;

// The mouse position at the last successful call to the mouseMove listener.
var preMouseX;
var preMouseY;

// Factor by which to scale the mouse movement when applying rotation changes.
var rotateScale = .3;

// Factor by which to scale the mouse movement when applying translation changes.
var dragScale = 1.25;

// The distance to translate with arrows per frame.
var arrowDist = 7.5;

// Whether or not the left mouse button is pressed.
var leftIsDown = false;

// Whether or not the right mouse button is pressed.
var rightIsDown = false;

function mouseDownFunction(e)
{
	
	if(e.which)
	{
		switch(e.which)
		{
			case 1: leftIsDown = true; break;
			case 3: rightIsDown = true; break;
		}
	}
	else if(e.button)
	{
		switch(e.button)
		{
			case 0: leftIsDown = true; break;
			case 2: rightIsDown = true; break;
		}
	}
	else leftIsDown = true;
	
	// Return if you didn't click with the left button.
	
	// Get the bounding size and location of the canvas
	// so that we can translate the window mouse coordinates
	// to be relative to the canvas.
	var rect = canvas.getBoundingClientRect();
	curMouseX = e.clientX-rect.left;
	curMouseY = e.clientY-rect.top;
	preMouseX = e.clientX-rect.left;
	preMouseY = e.clientY-rect.top;
	
	/*
		Sampling the ID texture.
	*/
	// first we need to convert the mouse coordinates to scale with the ID texture.
	var fbMouseX = curMouseX/canvas.width * idFramebuffer.getWidth();
	var fbMouseY = curMouseY/canvas.height * idFramebuffer.getHeight();
	
	// sample the data. OH BOY
	var sample = new Uint8Array(4);
	idFramebuffer.use(glContext);
	glContext.readPixels(fbMouseX, fbMouseY, 1, 1, glContext.RGBA, glContext.UNSIGNED_BYTE, sample);
	
	// Make the iframe go away if it's there.
	$("#webpage_popup").fadeOut(200, function(){document.getElementById("webpage_popup").src = "";});
	// Display the data.
	var popup = $("#hud_info_popup");
	
	if(sample[0] == sample[2]) // Since the background is yellow if R and B match then we know the sampling is not the background.
	{
		if(leftIsDown)
		{
			curRoom = parseInt(sample[0]);
			handleRoomCheck(curRoom);
		}
	}
	else
	{
		popup.fadeOut(100);
		curRoom = 512;
	}
	
	// Make sure that the text pop-up is gone.
	$("#text").fadeOut(400);
	
}

function mouseUpFunction(e)
{
	if(e.which)
	{
		switch(e.which)
		{
			case 1: leftIsDown = false; break;
			case 3: rightIsDown = false; break;
		}
	}
	else if(e.button)
	{
		switch(e.button)
		{
			case 0: leftIsDown = false; break;
			case 2: rightIsDown = false; break;
		}
	}
	else leftIsDown = false;
}

function mouseMoveFunction(e)
{
	if(leftIsDown)
	{
		// Get the current mouse position.
		var mouseX = e.clientX;
		var mouseY = e.clientY;
		
		// If the current mouse position is available, we update what we have stored.
		if(mouseX)curMouseX = mouseX;
		if(mouseY)curMouseY = mouseY;
		
		// Get the difference between the current and previous mouse positions.
		var diffX = curMouseX - preMouseX;
		var diffY = curMouseY - preMouseY;
		
		// If the shift key is not pressed, we translate the model in the XZ plane.
		if(!shiftPressed)
		{
			xTrans += (Math.cos(degToRad(degreesX))*diffX*dragScale)-(Math.sin(degToRad(degreesX))*diffY*dragScale);
			zTrans += (Math.sin(degToRad(degreesX))*diffX*dragScale)+(Math.cos(degToRad(degreesX))*diffY*dragScale);
		}
		// Otherwise we rotate around the Y axis.
		else
			degreesX += diffX*rotateScale;	
		
		// Update the previous mouse location.
		preMouseX = curMouseX;
		preMouseY = curMouseY;
		
		// Make sure we haven't translated too far.
		//checkTrans(diffX, diffY);
	}
	else if(rightIsDown)
	{
		// Get the current mouse position.
		var mouseX = e.clientX;
		var mouseY = e.clientY;
		
		// If the current mouse position is available, we update what we have stored.
		if(mouseX)curMouseX = mouseX;
		if(mouseY)curMouseY = mouseY;
		
		// Get the difference between the current and previous mouse positions.
		var diffX = curMouseX - preMouseX;
		var diffY = curMouseY - preMouseY;
		
		// Update rotation angle.
		degreesX += diffX*rotateScale;				
		
		// Update the previous mouse location.
		preMouseX = curMouseX;
		preMouseY = curMouseY;	
	}		
}

function keyDownFunction(e)
{
	if(e.shiftKey)
	{
		shiftPressed = true;
	}
	
	if (e.keyCode == 37) // Left
		lPressed = true;
	if (e.keyCode == 38) // Up
		uPressed = true;
	if (e.keyCode == 39) // Right
		rPressed = true;
	if (e.keyCode == 40) // Down
		dPressed = true;
	//checkTrans();
	
}
function keyUpFunction(e)
{
	shiftPressed = false;
	if (e.keyCode == 37) lPressed = false;
	if (e.keyCode == 38) uPressed = false;
	if (e.keyCode == 39) rPressed = false;
	if (e.keyCode == 40) dPressed = false;
	
}

function keyPressedFunction()
{
	if(lPressed)
	{
		xTrans += (Math.cos(degToRad(degreesX))*arrowDist*dragScale)-(Math.sin(degToRad(degreesX))*0*dragScale);
		zTrans += (Math.sin(degToRad(degreesX))*arrowDist*dragScale)+(Math.cos(degToRad(degreesX))*0*dragScale);
	}
	if(uPressed)
	{
		xTrans += (Math.cos(degToRad(degreesX))*0*dragScale)-(Math.sin(degToRad(degreesX))*arrowDist*dragScale);
		zTrans += (Math.sin(degToRad(degreesX))*0*dragScale)+(Math.cos(degToRad(degreesX))*arrowDist*dragScale);
	}
	if(rPressed)
	{
		xTrans -= (Math.cos(degToRad(degreesX))*arrowDist*dragScale)-(Math.sin(degToRad(degreesX))*0*dragScale);
		zTrans -= (Math.sin(degToRad(degreesX))*arrowDist*dragScale)+(Math.cos(degToRad(degreesX))*0*dragScale);
	}
	if(dPressed)
	{
		xTrans -= (Math.cos(degToRad(degreesX))*0*dragScale)-(Math.sin(degToRad(degreesX))*arrowDist*dragScale);
		zTrans -= (Math.sin(degToRad(degreesX))*0*dragScale)+(Math.cos(degToRad(degreesX))*arrowDist*dragScale);
	}
	//checkTrans(dragScale, dragScale);
}

// Called when links are clicked.
function linkFunction(src)
{
	// Prevent redirects
	if(src && src != document.URL && src != "")
		$("#webpage_popup").fadeIn(200);
}

var scrollZoomScale = 10.0;

function scrollZoom(delta)
{
	camY -= Math.cos(degreesY)*scrollZoomScale*delta;
	camZ += Math.sin(degreesY)*scrollZoomScale*delta;
}

function scrollWheelFunction(event)
{
	//log("OH SHIT");
	var delta = 0;
	if (!event) /* For IE. */
	{
		event = window.event;
	}
	if (event.wheelDelta) /* IE/Opera. */
	{ 
		delta = event.wheelDelta/120;
	} 
	else if (event.detail) /* Mozilla case. */
	{ 
			 // In Mozilla, sign of delta is different than in IE.
			 // Also, delta is multiple of 3.
			delta = -event.detail/3;
	}
	if (delta)
	{
			scrollZoom(delta);
	}
	if (event.preventDefault)
	{
			event.preventDefault();
	}
	//log("DELTA: "+delta);
}

function handleRoomCheck(id)
{
	var room;
	//console.log"SEARCHING FOR ROOM ID: "+id);
	for(var i = 0; i < rooms.length; i++)
	{
		if(rooms[i].id == id) room = rooms[i];
	}
	
	if(!room) return;
	
	//console.log"FOUND ROOM");
	
	var roomElement;
	var hudElement = $("#hud_info_popup");
	switch(room.type)
	{
		case Room.TYPE.RESIDENTIAL:
			//console.log"updating RESIDENTIAL room");
			roomElement = $("#base_res_room");
			roomElement.children("#name").html(room.name);
			roomElement.children("#res_a").html(room.resA);
			roomElement.children("#res_b").html(room.resB);
			roomElement.children("#res_a_link").html("<a target=\"webpage_popup\" onclick=linkFunction(href) href="+room.resALink+">"+room.resALinkTitle+"</a>");
			roomElement.children("#res_b_link").html("<a target=\"webpage_popup\" onclick=linkFunction(href) href="+room.resBLink+">"+room.resBLinkTitle+"</a>");
			roomElement.children("#res_a_year").html(room.resAYear);
			roomElement.children("#res_b_year").html(room.resAYear);
			// Add in the special qualifications if there are any.
			//log("Qualifications length: \nRes A: "+room.resAQualifications.length+"\nRes B: "+room.resBQualifications.length);
			if(room.resAQualifications.length > 0)
			{
				roomElement.children("#qualificationsA").css("display", "inline");
				//document.getElementById("res_a_qualifications").style.display = "inline";
				roomElement.children("#res_a_qualifications").html(room.resAQualifications);
			}
			else
			{
				roomElement.children("#qualificationsA").css("display", "none");
				roomElement.children("#res_a_qualifications").html("");
			}
			if(room.resBQualifications.length > 0)
			{
				roomElement.children("#qualificationsB").css("display", "inline");
				//document.getElementById("res_b_qualifications").style.display = "inline";
				roomElement.children("#res_b_qualifications").html(room.resBQualifications);
			}
			else 
			{
				roomElement.children("#qualificationsB").css("display", "none");
				roomElement.children("#res_b_qualifications").html("");
			}
			hudElement.fadeOut(100, function()
									{
										hudElement.fadeIn(100);
										hudElement.html(roomElement.html());
									});
			break;
		case Room.TYPE.SPECIAL:
			//console.log"updating SPECIAL room");
			roomElement = $("#base_spec_room");
			roomElement.children("#name").html(room.name);
			roomElement.children("#room_link").html("<a target=\"webpage_popup\" onclick=linkFunction(href) href="+room.roomLink+">"+room.roomLinkTitle+"</a>");
			roomElement.children("#eboard").html(room.eb);
			roomElement.children("#eb_link").html("<a target=\"webpage_popup\" onclick=linkFunction(href) href="+room.ebLink+">"+room.ebLinkTitle+"</a>");
			roomElement.children("#doorlock").html("<a target=\"webpage_popup\" onclick=linkFunction(href) href="+room.doorlockLink+">"+room.doorlockTitle+"</a>");
			hudElement.fadeOut(100, function()
									{
										hudElement.fadeIn(100);
										hudElement.html(roomElement.html());
									});
			break;
		case Room.TYPE.RESTROOM:
			//console.log"updating RESTROOM room");
			roomElement = $("#base_restroom");
			roomElement.children("#name").html(room.name);
			roomElement.children("#coed").html(room.coed);
			roomElement.children("#soap").html("<a target=\"webpage_popup\" onclick=linkFunction(href) href="+room.soapLink+">"+room.soapTitle+"</a>");
			hudElement.fadeOut(100, function()
									{
										hudElement.fadeIn(100);
										hudElement.html(roomElement.html());
									});
			break;
		case Room.TYPE.ELEVATOR:
			//console.log"updating ELEVATOR room");
			roomElement = $("#base_elevator");
			roomElement.children("#name").html(room.name);
			roomElement.children("#harold").html("<a target=\"webpage_popup\" onclick=linkFunction(href) href="+room.haroldLink+">"+room.haroldTitle+"</a>");
			hudElement.fadeOut(100, function()
									{
										hudElement.fadeIn(100);
										hudElement.html(roomElement.html());
									});
			break;
		case Room.TYPE.FACILITIES: 
			//console.log"updating FACILITY room");
			roomElement = $("#base_facilities");
			roomElement.children("#name").html(room.name);
			hudElement.fadeOut(100, function()
									{
										hudElement.fadeIn(100);
										hudElement.html(roomElement.html());
									});
			break;
		case Room.TYPE.UTILITIES: 	
			//console.log"updating UTILITIES room");
			roomElement = $("#base_utilities");
			roomElement.children("#name").html(room.name);
			hudElement.fadeOut(100, function()
									{
										hudElement.fadeIn(100);
										hudElement.html(roomElement.html());
									});
			break;
		case Room.TYPE.NETWORKING:  	
			//console.log"updating NET room");
			roomElement = $("#base_net_room");
			roomElement.children("#name").html(room.name);	
			hudElement.fadeOut(100, function()
									{
										hudElement.fadeIn(100);
										hudElement.html(roomElement.html());
									});
			break;
		case Room.TYPE.PROJECT: 		
			//console.log"updating PROJECT room");	 	
			roomElement = $("#base_project");
			roomElement.children("#name").html("<a target=\"webpage_popup\" onclick=linkFunction(href) href="+room.projectLink+">"+room.name+"</a>");
			roomElement.children("#link").html("<a target=\"webpage_popup\" onclick=linkFunction(href) href="+room.infoLink+">"+room.infoLinkTitle+"</a>");
			hudElement.fadeOut(100, function()
									{
										hudElement.fadeIn(100);
										hudElement.html(roomElement.html());
									});
			break;
		case Room.TYPE.OTHER:		
			//console.log"updating OTHER room"); 	
			roomElement = $("#base_other");
			roomElement.children("#name").html(room.name);
			hudElement.fadeOut(100, function()
									{
										hudElement.fadeIn(100);
										hudElement.html(roomElement.html());
									});
			break;
		case Room.TYPE.STAIRS: 		
			//console.log"updating STAIRS room");	 	
			roomElement = $("#base_stairs");
			roomElement.children("#name").html(room.name);
			roomElement.children("#exit_to").html(room.exitTo);
			hudElement.fadeOut(100, function()
									{
										hudElement.fadeIn(100);
										hudElement.html(roomElement.html());
									});
			break;
		default:
			//console.log"UNABLE TO DETERMINE ROOM TYPE");
			break;
	}
}

function checkTrans(diffX, diffZ)
{
	// Rotate the translated values for accurate bounding.
	var transXTrans = (Math.cos(degToRad(degreesX))*xTrans*dragScale)-(Math.sin(degToRad(degreesX))*zTrans*dragScale);
	var transZTrans = (Math.sin(degToRad(degreesX))*xTrans*dragScale)+(Math.cos(degToRad(degreesX))*zTrans*dragScale);
	
	// Check and reset x translation.
	if(transXTrans < xMin) xTrans = xMin+(2*diffX);
	else if(transXTrans > xMax) xTrans = xMax-(2*diffX);
	
	// Check and reset Z translation.
	if(transZTrans < zMin) zTrans = zMin+(2*diffZ);
	else if(transZTrans > zMax) zTrans = zMax-(2*diffZ);
}

function onContextLost(event)
{
	alert("WebGL context lost.");
	event.preventDefault();
}

function onContextRestored(event)
{
	alert("Recreating GL stuff at context restoration.");
	initWebGLComponents();
}
	
	