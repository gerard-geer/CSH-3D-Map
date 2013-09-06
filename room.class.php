<?php
	
	// Include the Resident class.
	require_once('resident.class.php');	
	
	/*
	A CSH Room. Just two Residents and a room number.
	*/
	class Room
	{
		// The number of this Room.
		private $number = 0;
		
		// A reference to the first Resident of this Room.
		private $residentA = null;
		
		// A reference to the second Resident of this Room.
		private $residentB = null;
		
		// Constructs the Room.
		function Room($roomNumber)
		{
			$this->$number    = $roomNumber;
		}
		
		// Returns the first Resident.
		function getResA()
		{
			return $this->$residentA;
		}
		
		// Sets afresh the first Resident.
		function setResA(&$roomResidentA)
		{
			$this->$residentA = $roomResidentA;
		}
		
		// Returns the second Resident.
		function getResB()
		{
			return $this->$residentB;
		}
		
		// Sets anew the second Resident.
		function setResB($roomResidentB)
		{
			$this->$residentB = $roomResidentB;
		}
	}
?>