<?php

	header ('Content-type: text/html; charset=utf-8');
	//echo '<p>starting php</p>';
	require_once('php/constants.php');		// Some constants for stability in life.
	require_once('php/ldap.class.php');		// The LDAP helper class definition.
	require_once('php/resident.class.php'); // The Resident class definition.
	require_once('php/extras.php');			// Fun stuff extras.
	
	// Store "Basic Mode" status.
	$isBasic = ( isset($_GET["basicMode"]) ? "true": "false" );
	echo "<script> var basicMode = ".$isBasic.";</script>";
	
	// Store "Low Resolution" status.
	$lowRes = ( isset($_GET["lowRes"]) ? "true": "false" );
	echo "<script>"." var lowRes = ".$lowRes.";</script>";
	
	// Store "taste the rainbow" status.
	$rainbow = ( isset($_GET["tasteTheRainbow"]) ? "true": "false" );
	echo "<script> var isRainbow = ".$rainbow.";</script>";		
	
	// Create an empty array to store the member entries.
	$memberEntries = array();
	
	// Create an instance of the LDAP helper class.
	$ldap = new LdapHelper(); // Thanks Crawford, btdubs.
	
	// Connect to LDAP.
	$ldap->connect(LDAP_URL);
	
	// Query the entries of all on floor members.
	$ldap->fetch_on_floors(USERS_DN, $memberEntries);
	// Append to those entries whether or not they are EBoard.
	$ldap->fetch_eboard(EBOARD_DN, $memberEntries);
	// And do the same for whether or not they are and RTP.
	$ldap->fetch_rtps(RTP_DN, $memberEntries);
	// Close the connection to LDAP so people don't shit themselves.
	$ldap->disconnect();
	
	// Create an array of Residents.
	$residents = array();
	
	// Create Resident instances for each member received.
	
	foreach($memberEntries as $member)
	{
		$resRoomNumber = (isset($member['room'])) ? $member['room'] : 0;	// Get the room number of the member.
		$resName = (isset($member['name'])) ? $member['name'] : "Unknown";	// Get the name of the member.
		$resUsername = (isset($member['username'])) ? $member['username'] : "D.N.E.";	// Get the username of the member.
		$resYear = (isset($member['year'])) ? $member['year'] : "Unknown";			// Get the year of the member.
		
		if(isset($member['drinkadmin'][0]))
		{
			$resDrinkAdmin = $member['drinkadmin'][0]==1 ? true : false;
		}
		
		// Create the Resident instance to house this member.
		$curResident = new Resident($resRoomNumber, $resName, $resUsername, $resYear);
		
		// Set EBoard and RTP status.
		if($member['eboard']) $curResident->setEboard(true);
		if($member['rtp']) $curResident->setRTP(true);
		if($resDrinkAdmin) $curResident->setDrinkAdmin(true);
		
		$curResident->setRoomNumber($ROOM_NUMBER_TO_COLOR[$curResident->getRoomNumber()]);
		// Push onto the array the current Resident.
		array_push($residents, $curResident);
	}
	
	// Create an array to store JSON-encoded residents.
	$encodedResidentsIndependent = array();
	foreach($residents as $res)
	{
		// Each room number can potentially have two members assigned to it, therefore we create a 2 item secondary array.
		if(isset($encodedResidentsIndependent[$res->getRoomNumber()][0])) $encodedResidentsIndependent[$res->getRoomNumber()][1] = $res->to_json();
		else $encodedResidentsIndependent[$res->getRoomNumber()][0] = $res->to_json();
	}
	
	// Create a JSON string that concatenates every resident.
	$encodedResidents = json_encode($encodedResidentsIndependent, JSON_FORCE_OBJECT);
	
	// Get the current temperature.
	$temp = 0;//getTemperature(76118);
	
	// Spit out a JSON object that holds all the rooms and their residents.
	echo "<script> var jsonResidents = ".$encodedResidents.";</script>";	
?>
