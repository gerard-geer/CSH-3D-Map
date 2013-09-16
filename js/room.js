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

// Create a basic JSON object of a place-holder resident, just in case the actual resident does not exist.
var baseJSONResident = "{\"name\":\"TittiesNToots\",\"username\":\"D.N.E.\",\"memberSince\":0,\"roomNumber\":0,\"qualifications\":\"\"}";
	
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

// Load the residential rooms from our PHP work.
function loadResRooms(rooms)
{
	var resNode = xmlDoc.getElementsByTagName("residentials")[0];
	var residentials = resNode.getElementsByTagName("room");
	
	for(var i = 0; i < residentials.length; i++)
	{
		// Create a new Room instance to house our data.
		var newRoom = new Room(parseInt(residentials[i].getAttribute("rgb")), residentials[i].getAttribute("name"), Room.TYPE.RESIDENTIAL);
		
		// Pre-emptively store the place-holder resident just in case we can't get any actual information for them.
		var resA = $.parseJSON(baseJSONResident);
		var resB = $.parseJSON(baseJSONResident);
		
		// Try to pull the first resident out of JSON. json_encode doesn't do well with json object arrays of json objects,
		// so it just stores all but the top level as mere Strings. (wtf). This means we have to re-parse it.
		try{
			resA = $.parseJSON(jsonResidents[newRoom.id][0]);
		}
		catch(e){
			// Don't worry about a thing.
		}
		// Do the same parsing dance with the second resident.
		try{
			resB = $.parseJSON(jsonResidents[newRoom.id][1]);
		}
		catch(e){
			// Don't worry about a thing.
		}
		// I don't think someone named TittiesNToots would be able to afford college.
		// It's also a Veety story, b-t-dubs.
		if(resA.name == 'TittiesNToots')
		{
			newRoom.resA 			   = "unknown";
			newRoom.resAYear      	   = "unknown";
			newRoom.resAQualifications = "";
			newRoom.resALink           = "";
			newRoom.resALinkTitle      = "No member? No link.";
		}
		else{
			newRoom.resA 			   = resA.name+" ("+resA.username+")";
			newRoom.resAYear      	   = resA.memberSince;
			newRoom.resAQualifications = resA.qualifications;
			newRoom.resALink           = "https://members.csh.rit.edu/profiles/members/"+resA.username;
			newRoom.resALinkTitle      = resA.name + " on Members";
		}
		
		if(resB.name == 'TittiesNToots')
		{
			newRoom.resB          	   = "unknown";
			newRoom.resBYear      	   = "unknown";
			newRoom.resBQualifications = "";
			newRoom.resBLink       	   = "";
			newRoom.resBLinkTitle      = "No member? No link.";
		}
		else
		{
			newRoom.resB 			   = resB.name+" ("+resB.username+")";
			newRoom.resBYear      	   = resB.memberSince;
			newRoom.resBQualifications = resB.qualifications;
			newRoom.resBLink           = "https://members.csh.rit.edu/profiles/members/"+resB.username;
			newRoom.resBLinkTitle      = resB.name + " on Members";
		}
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

		
	