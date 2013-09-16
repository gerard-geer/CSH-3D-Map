
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

// Whether or not the mouse is pressed.
var mouseIsDown = false;

function mouseDownFunction(e)
{
	mouseIsDown = true;
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
	
	// Display the data.
	var popup = document.getElementById("hud_info_popup");
	
	if(sample[0] == sample[2]) // Since the background is yellow if R and B match then we know the sampling is not the background.
	{
		curRoom = parseInt(sample[0]);
		handleRoomCheck(curRoom);
	}
	else
	{
		popup.style.display = "none";
		curRoom = 512;
	}
	
}

function mouseUpFunction(e)
{
	mouseIsDown = false;
}

function mouseMoveFunction(e)
{
	if(mouseIsDown)
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

var scrollZoomScale = 10.0;

function scrollZoom(delta)
{
	camY -= Math.cos(degreesY)*scrollZoomScale*delta;
	camZ += Math.sin(degreesY)*scrollZoomScale*delta;
}

function scrollWheelFunction(event)
{
	//console.log("OH SHIT");
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
	//console.log("DELTA: "+delta);
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
	var hudElement = document.getElementById("hud_info_popup");
	switch(room.type)
	{
		case Room.TYPE.RESIDENTIAL:
			//console.log"updating RESIDENTIAL room");
			roomElement = $("#base_res_room");
			roomElement.children("#name").html(room.name);
			roomElement.children("#res_a").html(room.resA);
			roomElement.children("#res_b").html(room.resB);
			roomElement.children("#res_a_link").html("<a href="+room.resALink+">"+room.resALinkTitle+"</a>");
			roomElement.children("#res_b_link").html("<a href="+room.resBLink+">"+room.resBLinkTitle+"</a>");
			roomElement.children("#res_a_year").html(room.resAYear);
			roomElement.children("#res_b_year").html(room.resAYear);
			// Add in the special qualifications if there are any.
			//console.log("Qualifications length: \nRes A: "+room.resAQualifications.length+"\nRes B: "+room.resBQualifications.length);
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
			
			hudElement.innerHTML = roomElement.html();
			hudElement.style.display = "inline";
			break;
		case Room.TYPE.SPECIAL:
			//console.log"updating SPECIAL room");
			roomElement = $("#base_spec_room");
			roomElement.children("#name").html(room.name);
			roomElement.children("#room_link").html("<a href="+room.roomLink+">"+room.roomLinkTitle+"</a>");
			roomElement.children("#eboard").html(room.eb);
			roomElement.children("#eb_link").html("<a href="+room.ebLink+">"+room.ebLinkTitle+"</a>");
			hudElement.innerHTML = roomElement.html();
			hudElement.style.display = "inline";
			break;
		case Room.TYPE.RESTROOM:
			//console.log"updating RESTROOM room");
			roomElement = $("#base_restroom");
			roomElement.children("#name").html(room.name);
			roomElement.children("#coed").html(room.coed);
			hudElement.innerHTML = roomElement.html();
			hudElement.style.display = "inline";
			break;
		case Room.TYPE.ELEVATOR:
			//console.log"updating ELEVATOR room");
			roomElement = $("#base_elevator");
			roomElement.children("#name").html(room.name);
			hudElement.innerHTML = roomElement.html();
			hudElement.style.display = "inline";
			break;
		case Room.TYPE.FACILITIES: 
			//console.log"updating FACILITY room");
			roomElement = $("#base_facilities");
			roomElement.children("#name").html(room.name);
			hudElement.innerHTML = roomElement.html();
			hudElement.style.display = "inline";
			break;
		case Room.TYPE.UTILITIES: 	
			//console.log"updating UTILITIES room");
			roomElement = $("#base_utilities");
			roomElement.children("#name").html(room.name);
			hudElement.innerHTML = roomElement.html();
			hudElement.style.display = "inline";
			break;
		case Room.TYPE.NETWORKING:  	
			//console.log"updating NET room");
			roomElement = $("#base_net_room");
			roomElement.children("#name").html(room.name);
			hudElement.innerHTML = roomElement.html();
			hudElement.style.display = "inline";
			break;
		case Room.TYPE.PROJECT: 		
			//console.log"updating PROJECT room");	 	
			roomElement = $("#base_project");
			roomElement.children("#name").html("<a href="+room.projectLink+">"+room.name+"</a>");
			roomElement.children("#link").html("<a href="+room.infoLink+">"+room.infoLinkTitle+"</a>");
			hudElement.innerHTML = roomElement.html();
			hudElement.style.display = "inline";
			break;
		case Room.TYPE.OTHER:		
			//console.log"updating OTHER room"); 	
			roomElement = $("#base_other");
			roomElement.children("#name").html(room.name);
			hudElement.innerHTML = roomElement.html();
			hudElement.style.display = "inline";
			break;
		case Room.TYPE.STAIRS: 		
			//console.log"updating STAIRS room");	 	
			roomElement = $("#base_stairs");
			roomElement.children("#name").html(room.name);
			roomElement.children("#exit_to").html(room.exitTo);
			hudElement.innerHTML = roomElement.html();
			hudElement.style.display = "inline";
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
	
	