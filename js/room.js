Room.TYPE = {
	RESIDENTIAL: 	0,
	SPECIAL: 		1,
	RESTROOM: 		2,
	ELEVATOR: 		4,
	FACILITIES: 	8,
	UTILITIES: 		16,
	NETWORKING: 	32,
	PROJECT: 		64,		//Getting big now...
	OTHER:			128,
	STAIRS: 		256 	//I forgot it, okay?!
};
	
// Construct a room with properties that are common to all.
function Room(colorID, roomName, roomType)
{
	this.id = colorID;
	this.name = roomName;
	this.type = roomType;
}

Room.prototype.getID = function()
{
	return this.id;
}

function loadResRooms(rooms)
{
	var resNode = xmlDoc.getElementsByTagName("residentials")[0];
	var residentials = resNode.getElementsByTagName("room");
	//console.log"Number of residential rooms: "+residentials.length);
	
	/*var phpRooms = $.ajax({
							url: "<?php echo site_url('json_encode($rooms);'); ?>",
							type: "POST",
							data: phpRooms,
							dataType: "json", 
							success: function(data) {console.log(data);}});*/
	//console.log(phpRooms);
	for(var i = 0; i < residentials.length; i++)
	{
		var newRoom = new Room(parseInt(residentials[i].getAttribute("rgb")), residentials[i].getAttribute("name"), Room.TYPE.RESIDENTIAL);
		newRoom.resA 			   = "<?php echo $rooms["+newRoom.id+"]->getResA()->getName() . ' (' . echo $rooms["+newRoom.id+"]->getResA()->getUsername() . ')'; ?>";
		newRoom.resB          	   = "<?php echo $rooms["+newRoom.id+"]->getResB()->getName() . ' (' . echo $rooms["+newRoom.id+"]->getResB()->getUsername() . ')'; ?>";
		
		newRoom.resAYear      	   = "<?php echo $rooms["+newRoom.id+"]->getResA()->getMemberSince();?>";
		newRoom.resBYear      	   = "<?php echo $rooms["+newRoom.id+"]->getResB()->getMemberSince();?>";
		
		newRoom.resAQualifications = "<?php echo $rooms["+newRoom.id+"]->getResA()->getQualifications();?>";
		newRoom.resBQualifications = "<?php echo $rooms["+newRoom.id+"]->getResB()->getQualifications();?>";
		
		newRoom.resALink           = "<?php echo $MEMBERS_URL . $rooms["+newRoom.id+"]->getResA()->getUsername();?>";
		newRoom.resBLink           = "<?php echo $MEMBERS_URL . $rooms["+newRoom.id+"]->getResB()->getUsername();?>";
		newRoom.resALinkTitle      = "<?php echo $rooms["+newRoom.id+"]->getResA()->getUsername();?>" + " on Members";
		newRoom.resBLinkTitle      = "<?php echo $rooms["+newRoom.id+"]->getResB()->getUsername();?>" + " on Members";
		rooms.push(newRoom);
	}
	return rooms;
}

// I absolutely dread loading from XML.
function loadRooms(filename)
{
	// Create a variable to store the contents of the request for the XML document.
	var xmlRequest;
	
	// On IE7+, Firefox, Chrome, Opera, and Safari, we have the XMLHttpRequest object
	// to use for making XML requests.
	if (window.XMLHttpRequest)
	{
		xmlRequest=new XMLHttpRequest();
	}
	else // Otherwise we have to use the old ActiveX controls.
	{
		xmlRequest=new ActiveXObject("Microsoft.XMLHTTP");
	}
	// Open the XML request for specification.
	xmlRequest.open("GET",filename,false);
	// Send it. :)
	xmlRequest.send();
	// Extract the response from the request.
	xmlDoc=xmlRequest.responseXML;
	
	
	// Create an array to store all the rooms we are going to load.
	var roomArray = new Array();
	
	var specialRoomNode = xmlDoc.getElementsByTagName("special")[0];
	var specialRooms = specialRoomNode.getElementsByTagName("room");
	//console.log"Number of special rooms: "+specialRooms.length);
	for(var i = 0; i < specialRooms.length; i++)//console.logspecialRooms[i]);
	
	for(var i = 0; i < specialRooms.length; i++)
	{
		//console.log"RGB ID VALUE: "+specialRooms[i].getAttribute("rgb"));
		var newRoom = new Room(parseInt(specialRooms[i].getAttribute("rgb")), specialRooms[i].getAttribute("name"), Room.TYPE.SPECIAL);
		newRoom.eb            = specialRooms[i].getAttribute("eb");
		newRoom.ebLink        = specialRooms[i].getAttribute("eb_link");
		newRoom.ebLinkTitle   = specialRooms[i].getAttribute("eb_link_title");
		newRoom.roomLink      = specialRooms[i].getAttribute("room_link");
		newRoom.roomLinkTitle = specialRooms[i].getAttribute("room_link_title");
		roomArray.push(newRoom);
	}
	//console.log"Current size of room array: "+roomArray.length);
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var stairsNode = xmlDoc.getElementsByTagName("stairs")[0];
	var stairs = stairsNode.getElementsByTagName("room");
	//console.log"Number of stair rooms: "+stairs.length);
	
	for(var i = 0; i < stairs.length; i++)
	{
		var newRoom = new Room(parseInt(stairs[i].getAttribute("rgb")), stairs[i].getAttribute("name"), Room.TYPE.STAIRS);
		newRoom.exitTo = stairs[i].getAttribute("exit_to");
		roomArray.push(newRoom);
	}
	//console.log"Current size of room array: "+roomArray.length);
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var restroomNode = xmlDoc.getElementsByTagName("restrooms")[0];
	var restrooms = restroomNode.getElementsByTagName("room");
	//console.log"Number of restrooms: "+restrooms.length);
	
	for(var i = 0; i < restrooms.length; i++)
	{
		var newRoom = new Room(parseInt(restrooms[i].getAttribute("rgb")), restrooms[i].getAttribute("name"), Room.TYPE.RESTROOM);
		newRoom.coed = restrooms[i].getAttribute("coed");
		roomArray.push(newRoom);
	}
	//console.log"Current size of room array: "+roomArray.length);
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var elevatorNode = xmlDoc.getElementsByTagName("elevators")[0];
	var elevators = elevatorNode.getElementsByTagName("room");
	//console.log"Number of elevators: "+elevators.length);
	
	for(var i = 0; i < elevators.length; i++)
	{
		var newRoom = new Room(parseInt(elevators[i].getAttribute("rgb")), elevators[i].getAttribute("name"), Room.TYPE.ELEVATOR);
		roomArray.push(newRoom);
	}
	//console.log"Current size of room array: "+roomArray.length);
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var facilitiesNode = xmlDoc.getElementsByTagName("facilities")[0];
	var facilities = facilitiesNode.getElementsByTagName("room");
	//console.log"Number of facilities rooms: "+facilities.length);
	
	for(var i = 0; i < facilities.length; i++)
	{
		var newRoom = new Room(parseInt(facilities[i].getAttribute("rgb")), facilities[i].getAttribute("name"), Room.TYPE.FACILITIES);
		roomArray.push(newRoom);
	}
	//console.log"Current size of room array: "+roomArray.length);
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var utilitiesNode = xmlDoc.getElementsByTagName("utilities")[0];
	var utilities = utilitiesNode.getElementsByTagName("room");
	//console.log"Number of utilities rooms: "+utilities.length);
	
	for(var i = 0; i < utilities.length; i++)
	{
		var newRoom = new Room(parseInt(utilities[i].getAttribute("rgb")), utilities[i].getAttribute("name"), Room.TYPE.UTILITIES);
		roomArray.push(newRoom);
	}
	//console.log"Current size of room array: "+roomArray.length);
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var networkingNode = xmlDoc.getElementsByTagName("networking")[0];
	var netRooms = networkingNode.getElementsByTagName("room");
	//console.log"Number of networking rooms: "+netRooms.length);
	
	for(var i = 0; i < netRooms.length; i++)
	{
		var newRoom = new Room(parseInt(netRooms[i].getAttribute("rgb")), netRooms[i].getAttribute("name"), Room.TYPE.NETWORKING);
		roomArray.push(newRoom);
	}
	//console.log"Current size of room array: "+roomArray.length);
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var othersNode = xmlDoc.getElementsByTagName("other")[0];
	var others = othersNode.getElementsByTagName("room");
	//console.log"Number of other rooms: "+others.length);
	
	for(var i = 0; i < others.length; i++)
	{
		var newRoom = new Room(parseInt(others[i].getAttribute("rgb")), others[i].getAttribute("name"), Room.TYPE.OTHER);
		roomArray.push(newRoom);
	}
	//console.log"Current size of room array: "+roomArray.length);
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	var projectsNode = xmlDoc.getElementsByTagName("projects")[0];
	var projects = projectsNode.getElementsByTagName("room");
	//console.log"Number of projects (I know they aren't rooms per-say): "+projects.length);
	
	for(var i = 0; i < projects.length; i++)
	{
		var newRoom = new Room(parseInt(projects[i].getAttribute("rgb")), projects[i].getAttribute("name"), Room.TYPE.PROJECT);
		newRoom.projectLink		= projects[i].getAttribute("project_link");
		newRoom.infoLink		= projects[i].getAttribute("info_link");
		newRoom.infoLinkTitle 	= projects[i].getAttribute("link_title");
		roomArray.push(newRoom);
	}
	//console.log"Current size of room array: "+roomArray.length);
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	roomArray = loadResRooms(roomArray);
	///////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// AT LONG LAST
	return roomArray;
}

		
	