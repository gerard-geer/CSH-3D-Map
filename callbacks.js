

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
		handleRoomCheck(parseInt(sample[0]));
	}
	else
	{
		popup.style.display = "none";
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
		
		// Get the difference between the currrent and previous mouse positions.
		var diffX = curMouseX - preMouseX;
		var diffY = curMouseY - preMouseY;
		
		// If the shift key is pressed, we translate the model in the XZ plane.
		if(shiftPressed)
		{
			xTrans += (Math.cos(degToRad(degreesX))*diffX*dragScale)-(Math.sin(degToRad(degreesX))*diffY*dragScale);
			zTrans += (Math.sin(degToRad(degreesX))*diffX*dragScale)+(Math.cos(degToRad(degreesX))*diffY*dragScale);;
		}
		// Otherwise we rotate around the Y axis.
		else
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
}

function keyUpFunction(e)
{
	shiftPressed = false;
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
			roomElement.children("#name").html(room.name);
			roomElement.children("#link").html("<a href="+room.link+">"+room.linkTitle+"</a>");
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