<?php	
	// LDAP specific constants.
	define('BASE_DN',   'dc=csh,dc=rit,dc=edu');
	define('USERS_DN',  'ou=Users,' .BASE_DN);
	define('GROUPS_DN', 'ou=Groups,'.BASE_DN);
	define('EBOARD_DN', 'cn=eboard,'.GROUPS_DN);
	define('RTP_DN',    'cn=rtp,'   .GROUPS_DN);

	// Actual room numbers.
	$ROOM_NUMBERS = array(3009, 3013, 3016, 3020, 3024, 3050, 3051, 
	                      3054, 3055, 3059, 3063, 3066, 3067, 3070,
	                      3071, 3074, 3086, 3090, 3091, 3094, 3095, 
	                      3099, 3103, 3106, 3107, 3110, 3111, 3125, 
						  3126);
	
	// Grey-scale room IDS.
	$ROOM_COLORS = array(120, 124, 128, 132, 136, 140, 144, 
						 148, 152, 156, 160, 164, 168, 172,
	                     176, 180, 184, 188, 192, 196, 200,
	                     204, 208, 212, 216, 220, 224, 228,
	                     232);
				
	// Room colour to number associative array.
	$ROOM_COLOR_TO_NUMBER = array_combine($ROOM_COLORS, $ROOM_NUMBERS);
	
	// Room number to colour associative array.
	$ROOM_NUMBER_TO_COLOR = array_combine($ROOM_NUMBERS, $ROOM_COLORS);
	
	// Some more LDAP stuff.
	define('MEMBERS_URL', 'https://members.csh.rit.edu/profiles/members/');
	define('LDAP_URL',    'ldaps://ldap.csh.rit.edu');
	define('LDAP_PORT',   636);
?>
