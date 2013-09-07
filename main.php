<?php

	header ('Content-type: text/html; charset=utf-8');
	echo '<p>starting php</p>';
	require_once('credentials.php');	// Credentials used to log into LDAP.
	require_once('constants.php');		// Some constants for stability in life.
	require_once('ldap.class.php');		// The LDAP helper class definition.
	require_once('resident.class.php'); // The Resident class definition.
	require_once('room.class.php');		// The Room class definition.
	
	// Create an empty array to store the member entries.
	$memberEntries = array();
	
	// Create an instance of the LDAP helper class.
	$ldap = new LdapHelper(); // Thanks Crawford, btdubs.
	
	// Connect to LDAP.
	$ldap->connect('uid=' . LDAP_USERNAME . ','. USERS_DN, LDAP_PASSWORD, LDAP_URL, LDAP_PORT);
	
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
	
	$curMember = 0;
	// Create Resident instances for each member received.
	foreach($memberEntries as $member)
	{
		echo $curMember;
		$resRoomNumber = (isset($member['room'])) ? $member['room'] : 0;	// Get the room number of the member.
		echo $resRoomNumber;
		$resName = (isset($member['name'])) ? $member['name'] : "Unknown";	// Get the name of the member.
		$resUsername = (isset($member['username'])) ? $member['username'] : "D.N.E.";	// Get the username of the member.
		$resYear = (isset($member['year'])) ? $member['year'] : "Unknown";			// Get the year of the member.
		
		// Create the Resident instance to house this member.
		$curResident = new Resident($resRoomNumber, $resName, $resUsername, $resYear);
		
		// Set EBoard and RTP status.
		if($member['eboard']) $curResident->setEboard(true);
		if($member['rtp']) $curResident->setRTP(true);
		
		// Push onto the array the current Resident.
		array_push($residents, $curResident);
		$curMember ++;
	}
	
	// Create an array of Rooms.
	$rooms = array();
	
	// Create Room instances.
	foreach($residents as $res)
	{
		// If the Room with the current Resident's room number already exists,
		// we add him/her to the Room as the second resident.
		if(isset($rooms[$ROOM_NUMBER_TO_COLOR[$res->getRoomNumber()]]))
		{
			$rooms[$ROOM_NUMBER_TO_COLOR[$res->getRoomNumber()]]->setResB($res);
		}
		// Otherwise we create the room and are happy to add this current Resident
		// to the new Room.
		else
		{
			$rooms[$ROOM_NUMBER_TO_COLOR[$res->getRoomNumber()]] = new Room($res->getRoomNumber());
			$rooms[$ROOM_NUMBER_TO_COLOR[$res->getRoomNumber()]]->setResA($res);
		}
	}
	
?>