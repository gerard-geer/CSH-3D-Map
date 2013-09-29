
// A variable to store the current degreesX of rotation.
var degreesX = 30;
var degreesY = -40;

// Translation variables.
var xTrans = -200.0;
var yTrans = 800.0;
var zTrans = -950;

// Maximum translations bumper values.
var xMin = -3400, xMax = 1500;
var zMin = -2650, zMax = 1350;

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
	startRendering();
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
	
	// Make the iframe go away if it's there, and clear its source when it disappears.
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
	
	// Make sure that the intro pop-up is gone.
	$("#text").fadeOut(400);
	
}

function mouseUpFunction(e)
{
	// Chrome
	if(e.which)
	{
		switch(e.which)
		{
			case 1: leftIsDown = false; break;
			case 3: rightIsDown = false; break;
		}
	}
	// Firefox
	else if(e.button)
	{
		switch(e.button)
		{
			case 0: leftIsDown = false; break;
			case 2: rightIsDown = false; break;
		}
	}
	else leftIsDown = false;
	stopRendering();
}

function updateMouse(e)
{
	// Get the current mouse position.
	var mouseX = e.clientX;
	var mouseY = e.clientY;
	
	// If the current mouse position is available, we update what we have stored.
	if(mouseX)
	{
		if(curMouseX)preMouseX = curMouseX;	// Update previous mouse position.
		curMouseX = mouseX;
	}
	if(mouseY)
	{
		if(curMouseY)preMouseY = curMouseY;	// Update previous mouse position.
		curMouseY = mouseY;
	}
}

function translateModel(xDist, yDist)
{
	// Get the difference in translation the mouse movement creates.
	var diffX = (Math.cos(degToRad(degreesX))*xDist*dragScale)-(Math.sin(degToRad(degreesX))*yDist*dragScale);
	var diffZ = (Math.sin(degToRad(degreesX))*xDist*dragScale)+(Math.cos(degToRad(degreesX))*yDist*dragScale);
	
	if(xTrans + diffX < xMax && xTrans + diffX > xMin)
		xTrans += diffX;
	if(zTrans + diffZ < zMax && zTrans + diffZ > zMin)	
		zTrans += diffZ;
}


function translateModelByMouse(e)
{
	// Update the current and previous mouse positions.
	updateMouse(e);
	
	// Get the difference between the current and previous mouse positions.
	var mouseDiffX = curMouseX - preMouseX;
	var mouseDiffY = curMouseY - preMouseY;
	
	// Translate the model.
	translateModel(mouseDiffX, mouseDiffY);
}

function rotateModel(xDist, yDist)
{
	// Update rotation angle.
	degreesX += xDist*rotateScale;	
}

function rotateModelByMouse(e)
{
	// Update the current and previous mouse positions.
	updateMouse(e);
	
	// Get the difference between the current and previous mouse positions.
	var diffX = curMouseX - preMouseX;
	var diffY = curMouseY - preMouseY;
	
	// Rotate the model.
	rotateModel(diffX, diffY);
}

function mouseMoveFunction(e)
{
	if(leftIsDown)
	{
		if(shiftPressed)	rotateModelByMouse(e);
		else				translateModelByMouse(e);
	}
	else if(rightIsDown)
	{
		if(shiftPressed)	translateModelByMouse(e);
		else				rotateModelByMouse(e);
	}		
}

function keyDownFunction(e)
{
	if(e.shiftKey)
		shiftPressed = true;	
	if (e.keyCode == 37) // Left
		lPressed = true;
	if (e.keyCode == 38) // Up
		uPressed = true;
	if (e.keyCode == 39) // Right
		rPressed = true;
	if (e.keyCode == 40) // Down
		dPressed = true;
	if(shiftPressed || lPressed || uPressed || rPressed || dPressed)
	{
		startRendering();
	}
	
}
function keyUpFunction(e)
{
	stopRendering();
	shiftPressed = false;
	if (e.keyCode == 37) lPressed = false;
	if (e.keyCode == 38) uPressed = false;
	if (e.keyCode == 39) rPressed = false;
	if (e.keyCode == 40) dPressed = false;
	
}

function keyPressedFunction()
{
	if(lPressed) if(shiftPressed) rotateModel(arrowDist); else translateModel(arrowDist, 0);
	if(uPressed) translateModel(0, arrowDist);
	if(rPressed) if(shiftPressed) rotateModel(-arrowDist); else translateModel(-arrowDist, 0);
	if(dPressed) translateModel(0, -arrowDist);
}

// Called when links are clicked.
function linkFunction(src)
{
	// Prevent the map itself from opening in the iframe.
	if(src && src != document.URL && src != "")
		$("#webpage_popup").fadeIn(700);
}

function handleRoomCheck(id)
{
	// Search for the room.
	var room;
	for(var i = 0; i < rooms.length; i++)
	{
		if(rooms[i].id == id) room = rooms[i];
	}
	// If we didn't find a room, we report an error and return immediately.
	if(!room)
	{
		log("Unable to determine room type.");
		return;
	}
	
	var roomElement;
	var hudElement = $("#hud_info_popup");
	switch(room.type)
	{
		case Room.TYPE.RESIDENTIAL:
			roomElement = $("#base_res_room");
			roomElement.children("#name").html(room.name);
			roomElement.children("#res_a").html(room.resA);
			roomElement.children("#res_b").html(room.resB);
			roomElement.children("#res_a_link").html("<a target=\"webpage_popup\" onclick=linkFunction(href) href="+room.resALink+">"+room.resALinkTitle+"</a>");
			roomElement.children("#res_b_link").html("<a target=\"webpage_popup\" onclick=linkFunction(href) href="+room.resBLink+">"+room.resBLinkTitle+"</a>");
			roomElement.children("#res_a_year").html(room.resAYear);
			roomElement.children("#res_b_year").html(room.resAYear);
			// Add in the special qualifications if there are any.
			if(room.resAQualifications.length > 0)
			{
				roomElement.children("#qualificationsA").css("display", "inline");
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
			roomElement = $("#base_facilities");
			roomElement.children("#name").html(room.name);
			hudElement.fadeOut(100, function()
									{
										hudElement.fadeIn(100);
										hudElement.html(roomElement.html());
									});
			break;
		case Room.TYPE.UTILITIES: 	
			roomElement = $("#base_utilities");
			roomElement.children("#name").html(room.name);
			hudElement.fadeOut(100, function()
									{
										hudElement.fadeIn(100);
										hudElement.html(roomElement.html());
									});
			break;
		case Room.TYPE.NETWORKING:  	
			roomElement = $("#base_net_room");
			roomElement.children("#name").html(room.name);	
			hudElement.fadeOut(100, function()
									{
										hudElement.fadeIn(100);
										hudElement.html(roomElement.html());
									});
			break;
		case Room.TYPE.PROJECT: 		
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
			roomElement = $("#base_other");
			roomElement.children("#name").html(room.name);
			hudElement.fadeOut(100, function()
									{
										hudElement.fadeIn(100);
										hudElement.html(roomElement.html());
									});
			break;
		case Room.TYPE.STAIRS: 			
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
			break;
	}
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
	
	