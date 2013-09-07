<?php

	/* Define some tags to return when 
	this Resident is queried for its
	supplemental qualifications.*/
	define('TAG_RTP', "R.T.P.");
	define('TAG_EBOARD', "EBoard Member");
	
	/*
		A Resident of CSH, summed up as only PHP can.
	*/
	class Resident
	{
		// The name of the Resident.
		private $name = "";
		
		// The username of the Resident.
		private $username = "";
		
		// Whether or not the Resident is a member of EBoard.
		private $eboard = false;
		
		// Whether or not the Resident is an RTP.
		private $rtp = false;
		
		// The check in date of the Resident.
		private $memberSince = 0;
		
		// The number of this Resident's Room.
		private $roomNumber = 0;
		
		// Constructs the Resident.
		function Resident($residentRoomNumber, $residentName, $residentUsername, $residentMemberSince)
		{
			$this->$roomNumber = $residentRoomNumber;
			$this->$name = $residentName;
			$this->$username = $residentUsername;
			$this->$memberSince = $residentMemberSince;
		}
		
		// Returns the name of the resident.
		function getName()
		{
			return $this->$name;
		}
		
		// Sets the name of Rowdy.
		function setName($residentName)
		{
			$this->$name = $residentName;
		}
		
		// Returns to the Motherland.
		function getUsername()
		{
			return $this->$username;
		}
		
		// Provides safe access to the north.
		function setUsername($residentUsername)
		{
			$this->$username = $residentUsername;
		}
		
		// Constipates CSHNet bandwidth.
		function getMemberSince()
		{
			return $this->$memberSince;
		}
		
		// Rolls a melon down the hall.
		function setMemberSince($residentMemberSince)
		{
			$this->$memberSince = $residentMemberSince;
		}
		
		// Makes it rain dingle berries.
		function setEboard($isEboard)
		{
			$this->$eboard = $isEboard;
		}
		
		// Plays the Night Court theme song.
		function setRTP($isRTP)
		{
			$this->$rtp = $isRTP;
		}
		
		// Builds a brick house.
		function getRoomNumber()
		{
			return $this->$roomNumber;
		}
		
		// Sets up a killer spare.
		function setRoomNumber($residentRoomNumber)
		{
			$this->$roomNumber = $residentRoomNumber;
		}
		
		// Qualifies a random member for AARP benefits.
		function hasQualifications()
		{
			return ($this->$rtp || $this->$eboard);
		}
		
		// Removes ketchup from all hot-dogs.
		function getQualifications()
		{
			$returnMe = "";
			if($this->$rtp) $returnMe = $returnMe . TAG_RTP . " ";
			if($this->$rtp) $returnMe = $returnMe . TAG_EBOARD . " ";
		}
	}
?>