<?php
	require_once('constants.php');
	class LdapHelper {
		private $ldap_conn = null;

		private $FIND_ALL_MEMBERS_QUERY =  '(&(onfloor=1)(objectClass=houseMember))';
		private $FIND_ALL_MEMBERS_FIELDS = array('nickname',
		                                         'roomNumber',
		                                         'cn',
		                                         'memberSince',
		                                         'drinkAdmin',
		                                         'givenName');
		private $FIND_ALL_EBOARD_QUERY =   'objectClass=groupOfNames';
		private $FIND_ALL_EBOARD_FIELDS =  array('member');
		private $FIND_ALL_RTPS_QUERY =     'objectClass=groupOfNames';
		private $FIND_ALL_RTPS_FIELDS =    array('member');

		function LdapHelper() {

		}

		function connect($ldap_url) {
			# Set some LDAP options.
			ldap_set_option($conn, LDAP_OPT_PROTOCOL_VERSION, 3);
			# Connect to LDAP.
			$this->ldap_conn = ldap_connect($ldap_url);
			# Bind to LDAP.
			ldap_bind($this->ldap_conn);
			
			# Try to log in using the currently authenticated Webauth user.
			if(isset($_ENV["KRB5CCNAME"]))
			{
				putenv("KRB5CCNAME=" . getenv("KRB5CCNAME"));
				ldap_sasl_bind($this->ldap_conn,"","","GSSAPI") or die("Could not bind to LDAP 2: ");
			} 
			else 
			{
				echo "FATAL ERROR: WEBAUTH inproperly configured (missing KRB5CCNAME).";
				die(0);
			}	
		}


		function disconnect() {
			# Unbind from LDAP
			ldap_unbind($this->ldap_conn);
		}

		function fetch_on_floors($usersDN, &$members) {
			# Find all On-Floor members
			$results = ldap_search($this->ldap_conn,
			                       $usersDN,
			                       $this->FIND_ALL_MEMBERS_QUERY,
								   $this->FIND_ALL_MEMBERS_FIELDS);
			$onfloors = ldap_get_entries($this->ldap_conn, $results);

			# Calculate the current directory year
			$curyear = date('Y');
			if (date('W') < 26) {
				# Adjust for school years
				$curyear--;
			}
			
			# Insert them into the members array
			foreach ($onfloors as $person) {
				#echo "<br>".$person['dn'];
				if (!isset($person['dn']))
					continue;

				# Get the year level from the home directory
				$matches = null;
				preg_match('/^(\d{4})/', $person['membersince'][0], $matches);
				$yearLevel = $curyear - $matches[1] + 1;

				# Get the user name from the DN
				preg_match('/^uid=(.*),o.*\z/', $person['dn'], $matches);
				$username = $matches[1];

				if(isset($person['roomnumber'][0]))
				{
					$members[$person['dn']] = array(
						'name' => (!empty($person['nickname'][0])) ? $person['nickname'][0] : $person['givenname'][0],
						'username' => $username,
						'room' => $person['roomnumber'][0],
						'year' => $yearLevel,
						'rtp' => false,
						'eboard' => false,
						'drinkadmin' => $person['drinkadmin'][0]);
				}
			}
		}

		function fetch_eboard($eboardDN, &$members) {
			# Find all eboard members
			#echo '<br>searching for eboard';
			$results = ldap_search($this->ldap_conn,
			                       $eboardDN,
			                       $this->FIND_ALL_EBOARD_QUERY,
			                       $this->FIND_ALL_EBOARD_FIELDS);
			$entries = ldap_get_entries($this->ldap_conn, $results);

			$eboard = $entries[0]['member'];

			# Set the member to be on eboard
			foreach ($eboard as $person) {
				#echo '<br>'.$person;
				if(isset($members[$person]))
				{
					#echo '<br>found an EBOARD member!';
					$members[$person]['eboard'] = true;
				}
			}
		}

		function fetch_rtps($rtpDN, &$members) {
			# Find all RTPs
			#echo '<br>searching for RTPs';
			$results = ldap_search($this->ldap_conn,
			                       $rtpDN,
			                       $this->FIND_ALL_RTPS_QUERY,
			                       $this->FIND_ALL_RTPS_FIELDS);
			$entries = ldap_get_entries($this->ldap_conn, $results);

			$rtps = $entries[0]['member'];

			# Set the member to be an rtp
			foreach ($rtps as $person) {
				#echo '<br>'.$person;
				if(isset($members[$person]))
				{
					#echo '<br>found an RTP!';
					$members[$person]['rtp'] = true;
				}
			}
		}
	}
?>