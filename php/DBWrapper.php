<?php
require_once("db_login.php");
/**
 * A wrapper to handle all queries and abstract away all interactions with
 * the database from the rest of the system
 *
 * Author: Gabbie Burns (yinyang)
 */

class DBWrapper
{
  private static $instance; // A self-instance
  private $connection;      // An open connection to the database

  /**
   * Constructor. Connects to the database.
   */
   private function __construct()
   {
   	$this->connect();
   }

   /**
    * Returns a reference to the Singleton instance of this object
    *
    * Parameters:
    * None
    *
    * Returns:
    * $instance - the single instance to this object
    */
   public static function getInstance()
   {
     if(!self::$instance)
       {
	 self::$instance = new DBWrapper();
       }

     return self::$instance;
   }

  /**
   * Open a connection to the database using information from the db_login
   * file
   *
   * Parameters:
   * None
   *
   * Returns:
   * None
   */
  private function connect()
  {
    $this->connection = mysqli_init();
    $this->connection->real_connect(DB_HOST, DB_USER, DB_PASS);

    if(!$this->connection)
      {
	die("Could not connect to the database: <br />".mysql_error());
      }

    $db_select = $this->connection->select_db(DB_NAME);

    if(!$db_select)
      {
	die("Could not select the database: <br />".mysql_error());
      }

      
  }

  /**
   * Given a username, look up the specified piece of information from
   * this specified table and return the results
   *
   * Parameters:
   * $what - the field that should be selected
   * $table - which table to select from
   * $uname - the username to match
   * $first - boolean to flag whether or not more than one element is desired
   *
   * Returns:
   * $ret - the result of the query
   */
  public function userLookup($uname, $table, $what, $first)
  {
    $userLookupQuery = $this->connection->prepare("SELECT $what FROM $table WHERE username=?");
    $query = $userLookupQuery;
    $query->bind_param('s', $uname);

    $ret = $this->executeSelectQuery($query);
    $query->close();

    if( $first )
      {
	// If specified, return only the single first element
        return $ret[0][0];
      }
    else
      {
	// Otherwise return the entire result
	return $ret;
      }
  }

  /**
   * Given a username, update the specified piece of information from
   * the specified table and return the results
   *
   * Parameters:
   * $what - the field that should be selected
   * $table - which table to select from
   * $uname - the username to match
   * $value - the new value for the given field
   *
   * Returns:
   * $ret - the result of the query
   */
  public function userUpdate($uname, $table, $what, $value)
  {
    if( !$this->isEval() ){
        return;
    }
    
    $userUpdateQuery = $this->connection->prepare("UPDATE $table SET $what = ? WHERE username = ?");
    $query = $userUpdateQuery;
    $query->bind_param('ss', $value, $uname);

    $this->executeQuery($query);

    $this->writeLog($_SERVER['WEBAUTH_USER'], "Updated ".$uname."'s ".$what." in ".$table.".");
  }

  /**
   * Given a username, remove that specific user from the given table
   *
   * Parameters:
   * $uname - the username to remove
   * $table - the table to remove from
   *
   * Returns:
   * None
   */
  public function userDelete($uname, $table)
  {
    if( !$this->isEval() ){
        return;
    }
    $query = $this->connection->prepare("DELETE FROM ".$table." WHERE username=?");
    $query->bind_param('s', $uname);

    $this->executeQuery($query);

    $this->writeLog($_SERVER['WEBAUTH_USER'], "Deleted ".$uname." from ".$table.".");
  }

  /**
   * Perform a generic select query based on the information passed in
   *
   * Parameters:
   * $what - the field that should be selected
   * $table - which table to select from
   * $where - what field should be matched when selecting
   * $equals - the value to match when selecting
   *
   * Returns:
   * $ret - the result of the query
   */
  public function select($what, $table, $where, $equals)
  {
    $query = $this->connection->prepare("SELECT $what FROM ".$table." WHERE ".$where."= ?");
    $query->bind_param('s', $equals);

    $ret = $this->executeSelectQuery($query);
    $query->close();
    return $ret;
  }

  /**
   * Return the current state of the housing queue table
   *
   * Parameters:
   * None
   *
   * Returns:
   * $ret - an array containing an array for each member in the queue
   *        containing their username
   */
  public function getHousingQueue()
  {
    $query = $this->connection->prepare("SELECT username FROM queue ORDER BY timestamp ASC");

    $ret = $this->executeSelectQuery($query);
    $query->close();
    return $ret;
  }

  /**
   * Returns a set of information about a roster (either current or next)
   *
   * Parameters:
   * $current - true if the roster for the current year should be returned
   *
   * Returns:
   * $ret - an array containing all of the room information
   */
  public function getRoster($current)
  {

    if($current)
      {
	$ver = "current";
      }
    else
      {
	$ver = "next";
      }

    $getRosterQuery = $this->connection->prepare("SELECT room_number, roommate1, roommate2 FROM roster WHERE year = ? ORDER by room_number ASC");
    $query =  $getRosterQuery;
    $query->bind_param('s', $ver);

    $ret = $this->executeSelectQuery($query);
    $query->close();
    return $ret;
  }

  /**
   * Advances the roster such that the 'next' roster is 'current' and
   * a populate 'next' with a new blank roster
   *
   * Parameters:
   * None
   * Returns:
   * None
   */
   public function advanceRosters()
   {
       $target = "next";
       $currentLiteral = "current";
       $query = $this->connection->prepare("SELECT DISTINCT room_number from roster");
       $roomList = $this->executeSelectQuery($query);
       $query->close();
       $selectQuery = $this->connection->prepare("SELECT roommate1, roommate2 from roster where room_number=? and year=?");
       $updateQuery = $this->connection->prepare("UPDATE roster SET roommate1=?, roommate2=? WHERE room_number=? AND year=?");
       foreach($roomList as $room) {
           $selectQuery->bind_param('ss', $room[0], $target);
           $next_room_mates = $this->executeSelectQuery($selectQuery);
           $updateQuery->bind_param('ssss',$next_room_mates[0][0], $next_room_mates[0][1], $room[0], $currentLiteral); 
           $this->executeQuery($updateQuery);
       }
       $updateQuery = $this->connection->prepare("UPDATE roster SET roommate1='', roommate2='' WHERE year='next'");
       $this->executeQuery($updateQuery);
       $updateQuery = $this->connection->prepare("UPDATE roster SET roommate2='EMPTY' WHERE year='next' and (room_number=3074 or room_number=3125)");
       $this->executeQuery($updateQuery);
   }

  /**
   * Return the recorded voting requirements
   *
   * Parameters:
   * None
   *
   * Returns:
   * $ret - an array containing an array for each different type of voting
   */
  public function getVotingInfo()
  {
    $query = $this->connection->prepare("SELECT vote_type, percent_vote, percent_pass FROM voting_counts ORDER BY ID ASC");

    $ret = $this->executeSelectQuery($query);
    $query->close();
    return $ret;
  }

  /**
   * Return the list of pending major projects
   *
   * Parameters:
   * None
   *
   * Returns:
   * $ret - an array containing an array for each pending major project
   *        specifying the user, project name, committee, and description
   */
  public function getPendingProjects()
  {
    $query = $this->connection->prepare("SELECT username, project_name, project_committee, project_description FROM major_project WHERE status='pending'");

    $ret = $this->executeSelectQuery($query);
    $query->close();
    for($i = 0; $i < count($ret); $i++) {
        $entry = $ret[$i];
        $ret[$i][1] = $this->displayPrepString($entry[1]);
        $ret[$i][3] = $this->displayPrepString($entry[3]);
    }
    return $ret;
  }

  /**
   * Return the list of pending conditionals, for both evaluations
   *
   * Parameters:
   * None
   *
   * Returns:
   * $ret - an array containing an array for each pending major project
   *        specifying the user, conditional description, and deadline
   */
  public function getPendingConditionals()
  {
    $query = $this->connection->prepare("SELECT username, description, deadline FROM conditionals WHERE status='pending' ORDER BY deadline ASC");

    $ret = $this->executeSelectQuery($query);
    $query->close();
    return $ret;
  }

  /**
   * Return a list of major projects for the given user
   *
   * Parameters:
   * $uname - the user in question
   *
   * Returns:
   * $ret - an array containing an array for each major project belonging to 
   * that user specifying the project name, committee, description, and status
   */
  public function getUserProjects($uname)
  {
    $query = $this->connection->prepare("SELECT project_name, project_committee, project_description, status FROM major_project WHERE username=?");
    $query->bind_param('s', $uname);

    $ret =  $this->executeSelectQuery($query);

    for($i = 0; $i < count($ret); $i++) {
        $entry = $ret[$i];
        $ret[$i][0] = $this->displayPrepString($entry[0]);
        $ret[$i][2] = $this->displayPrepString($entry[2]);
    }
    $query->close();
    return $ret;
  }

  /**
   * Return any assigned conditional for the given user
   *
   * Parameters:
   * $uname - the user in question
   *
   * Returns:
   * $ret - an array containing an array for each conditional belonging to 
   * that user specifying the description and deadline
   */
  public function getUserConditional($uname)
  {
    $query = $this->connection->prepare("SELECT description, deadline, status FROM conditionals WHERE username=?");
    $query->bind_param('s', $uname);

    $ret =  $this->executeSelectQuery($query);
    $query->close();
    return $ret;
  }

  /**
   * Returns the user's saved winter eval information
   *
   * Parameters:
   * $uname - the user in question
   *
   * Returns:
   * $ret - array containing the answers for each of the 6 fields on the winter
   *        evals forms
   */
  public function getWinterEvalForm($uname)
  {
    $ret = $this->userLookup($uname, "winter_evals", "*", false); 
    return $ret;
  }

  /**
   * Returns all of the winter evals forms
   *
   * Parameters:
   * None
   *
   * Returns
   * $ret - an array of all of of the winder evals forms
   */
   public function getWinterEvalForms()
   {
       $query = $this->connection->prepare("SELECT * FROM winter_evals");
       $ret =  $this->executeSelectQuery($query);
       $query->close();
       return $ret;
   }

   /**
    * Adds a new user to the system
    *
    * Parameters:
    * $uname - the new member's username
    * $onfloor - whether or not the new member is onfloor
    * $packet - the date that the member's packet is due
    * $eval - the date to hold the member's 10-week evaluation
    *
    * Returns:
    * None
    */
   public function addNewMember($uname, $onfloor, $packet, $eval)
   {
    if( !$this->isEval() ){
        return;
    }
    if( !$onfloor ) {
      $onfloor = '0';
    }
     $query = $this->connection->prepare("INSERT INTO members (username, on_floor) VALUES (?,?)");
     $query->bind_param('ss', $uname, $onfloor);
     $this->executeQuery($query);

     $query = $this->connection->prepare("INSERT INTO freshman_evals (username, packetDueDate, voteDate) Values (?,?,?)");
     $query->bind_param('sss', $uname,$packet, $eval);
     $this->executeQuery($query);

     $this->writeLog($_SERVER['WEBAUTH_USER'], "Added new user:".$uname.".");

   }

   /**
    * Adds a upperclassmen to the system
    *
    * Parameters:
    * $uname - the member's username
    * $onfloor - whether or not the member is onfloor
    * $alumniable - whether or not the member has pasted a spring evaluation
    */
    public function addMember($uname, $onfloor, $voting, $alumniable){
      if( !$this->isEval() ){
        return;
      }
      if( !$alumniable ) {
        $alumniable = '0';
      }
      if( !$onfloor ) {
          $onfloor = '0';
      }
      if( !$voting ) {
          $voting = '0';
      }

      $query = $this->connection->prepare("INSERT INTO members (username, on_floor, voting, alumniable) VALUES (?,?,?,?)");
      $query->bind_param('ssss', $uname, $onfloor, $voting, $alumniable);
      $this->executeQuery($query);

      $query = $this->connection->prepare("INSERT INTO spring_evals (username, result) VALUES (?,'pending')");
      $query->bind_param('s', $uname);
      $this->executeQuery($query);
    }


   /**
    * Permanently deletes a members from the system.
    *
    * Parameters:
    * $uname - the username to delete
    *
    * Returns:
    * None
    */
   public function deleteMember($uname)
   {
     if( !$this->isEval() ){
         return;
     }
     $tables = array();
     array_push($tables, 'members');
     array_push($tables, 'freshman_evals');
     array_push($tables, 'spring_evals');
     array_push($tables, 'winter_evals');
     array_push($tables, 'conditionals');
     array_push($tables, 'queue');
     array_push($tables, 'house_meetings');
     array_push($tables, 'attendance');
     # Keep logs and major projects

     for( $i = 0; $i < count($tables); $i++ )
       {
           $query = $this->connection->prepare("DELETE FROM ".$tables[$i]." WHERE username=?");
           $query->bind_param('s', $uname);
           $this->executeQuery($query);
       }

     $query = $this->connection->prepare("UPDATE roster SET roommate1='' WHERE roommate1=?");
     $query->bind_param('s', $uname);
     $this->executeQuery($query);
     $query->close();

     $query = $this->connection->prepare("UPDATE roster SET roommate2='' WHERE roommate2=?");
     $query->bind_param('s', $uname);
     $this->executeQuery($query);
     $query->close();

     $this->writeLog($_SERVER['WEBAUTH_USER'], "Deleted ".$uname." from the database.");
   }
    
   /**
    * Changes a member's username from the original value to the new one
    *
    * Parameters:
    * $old - the member's original username
    * $new - the member's new username
    *
    * Returns:
    * None
    */
   public function changeUsername($old, $new)
   {
       if( !$this->isEval() ){
           return;
       }
     // Build a set of all the tables that need to be updated
     $tables = array();
     array_push($tables, "conditionals");
     array_push($tables, "freshman_evals");
     array_push($tables, "house_meetings");
     array_push($tables, "logs");
     array_push($tables, "major_project");
     array_push($tables, "members");
     array_push($tables, "queue");
     array_push($tables, "spring_evals");
     array_push($tables, "winter_evals");
     for( $i = 0; $i < count($tables); $i++ )
       {
           $query = $this->connection->prepare("UPDATE ".$tables[$i]." SET username=? WHERE username=?");
           $query->bind_param('ss', $new, $old);
           $this->executeQuery($query);
       }

    // Special case to update the roster, if applicable
    $query = $this->connection->prepare("UPDATE roster SET roommate1=? WHERE roommate1=?");
    $query->bind_param('ss', $new, $old);
    $this->executeQuery($query);
    $query->close();

    $query = $this->connection->prepare("UPDATE roster SET roommate2=? WHERE roommate2=?");
    $query->bind_param('ss', $new, $old);
    $this->executeQuery($query);
    $query->close();

    // Update usernames in attendance
    $query = $this->connection->prepare("UPDATE attendance SET username=? WHERE username=?");
    $query->bind_param('ss', $new, $old);
    $this->executeQuery($query);
    $query->close();

    $this->writeLog($_SERVER['WEBAUTH_USER'], "Changed ".$old."'s username to ".$new.".");
   }

   /**
    * Update the number of housing points the given user earned at winter evals
    *
    * Parameters:
    * $uname - the username of the person to be updated
    * $hp - the new number of points 
    *
    * Returns:
    * None
    */
   public function updateHousingPoints($uname, $hp)
   {
       $this->userUpdate($uname, 'winter_evals', 'points', $hp);
       $this->writeLog($_SERVER['WEBAUTH_USER'], "Updated ".$uname."'s housing points to ".$hp.".");
   }

  /**
   * Returns the user's saved freshman eval information
   *
   * Parameters:
   * $uname - the user in question
   * 
   * Returns:
   * $ret - the array containg the answers for each of the 3 fields on the
   *        freshman evals form
   */
  public function getFreshEvalForm($uname)
  {
    return $this->userLookup($uname, "freshman_evals", 
			     "numSocEvents, socEvents, comments", 
			     false);
  }

  /**
   * Returns the number of house meetings that were missed, but unexcused for
   * a given user
   *
   * Parameters:
   * $uname - the name of the user to look up
   * 
   * Returns:
   * $ret - the number of unexcused absences
   */
  public function getUnexcusedHM($uname)
  {
    $query = $this->connection->prepare("SELECT username FROM house_meetings WHERE username=? AND present=false AND excused=false");
    $query->bind_param('s', $uname);

    $result = $this->executeSelectQuery($query);
    $query->close();

    return count($result);
  }

  /**
   * Returns a combination of all of the comments related to house meetings
   * for the specified user
   * 
   * Parameters:
   * $uname - the name of the user to look up
   *
   * Returns:
   * $push - the comments for this user
   */
  public function getHMComments($uname)
  {
    // Get all of the comments for the user
    $query = $this->connection->prepare("SELECT date, comments FROM house_meetings WHERE username=? AND present='0' AND excused='0'");
    $query->bind_param('s', $uname);

    $results = $this->executeSelectQuery($query);
    $query->close();
    
    $push = "";

    for($i = 0; $i < count($results); $i++)
      {
	$push = $push."".$results[$i][0].": ".$results[$i][1]."</br>";
      }

    return $push;
    
  }

  /**
   * Returns information about the user's major project status and the name
   * of the relevant project submission
   *
   * Parameters:
   * $uname - the user to look up
   *
   * Returns:
   * $ret - an array containing two pieces of information: whether or not the
   *        user has passed a major project and the name of the best, most
   *        recently passed project (or None if no submissions have been made)
   */
  public function getMajorProject($uname)
  {
    $ret = array();

    // Look first for a passed major project
    $query = $this->connection->prepare("SELECT project_name FROM major_project WHERE username = ? ".
        "AND status='pass' ORDER BY timestamp ASC");
    $query->bind_param('s', $uname);    
    $result = $this->executeSelectQuery($query);
    $query->close();

    if( $result )
      {
	$ret[0] = true;
	$ret[1] = $result[0][0];
      }
    // If there are no passed projects, a failed submission
    else
      {
	$ret[0] = false;
	
        // Look second for a failed major project
	$query = $this->connection->prepare("SELECT project_name FROM major_project WHERE username=? ".
	  "AND status='fail' ORDER BY timestamp DESC");
        $query->bind_param('s', $uname);    
	$result = $this->executeSelectQuery($query);
        $query->close();
	
	if( $result )
	  {
	    $ret[1] = $result[0][0];
	  }
	else
	  {
            // Lastly, Look for a pending project
            $query = $this->connection->prepare("SELECT project_name FROM major_project WHERE username=? ".
              "AND status='pending' ORDER BY timestamp DESC");
            $query->bind_param('s', $uname);    
            $result = $this->executeSelectQuery($query);
            $query->close();
            
            if( $result )
              {
                $ret[1] = "pending";
              }
            else
              {
                $ret[1] = "NONE";
              }
	  }
      }

    return $ret;
  }

  /**
   * Returns information about the user's freshman project status and any
   * comments about their performance
   *
   * Parameters:
   * $uname - the user to look up
   *
   * Returns:
   * $ret - an array containing two pieces of information: whether or not the
   *        user passed the freshman project and any comments about them
   */
  public function getFreshProject($uname)
  {
    $ret = array();

    $query = $this->connection->prepare("SELECT freshProjPass, freshProjComments FROM freshman_evals WHERE username=?");
    $query->bind_param('s', $uname);

    $result = $this->executeSelectQuery($query);
    $query->close();

    // Put the results into the return array
    $ret[0] = $result[0][0];
    $ret[1] = $result[0][1];

    return $ret;
  }

  /**
   * Returns the usernames for everyone that is pending an evaluation
   *
   * Parameters:
   * $which - a value indicating which evluation is being looked up
   *
   * Returns:
   * $ret - the list of pending members
   */
  public function getEvaluees($which)
  {
    $query = $this->connection->prepare("SELECT username FROM ".$which."_evals ORDER BY result ASC");
    
    $result = $this->executeSelectQuery($query);
    $query->close();

    $ret = array();

    // Take out the username to return
    for($i = 0; $i < count($result); $i++)
      {
	array_push($ret, $result[$i][0]);
      }

    return $ret;
  }

  /**
   * Returns all of the attendance information for the house meeting on the
   * specified date
   *
   * Parameters:
   * $date - the date of the house meeting being accessed
   *
   * Returns:
   * $ret - an array containing the results: 
   *        [username, present, excused, comments]
   */
  public function getHMAttendance($date)
  {
    $query = $this->connection->prepare("SELECT username, present, excused, comments FROM house_meetings WHERE date=?");
    $query->bind_param('s', $date);

    $ret =  $this->executeSelectQuery($query);
    $query->close();
    return $ret;
  }

  /**
   * Returns all of the logs stored in the database
   *
   * Parameters:
   * $search - a search parameter to filter the logs
   *
   * Returns:
   * $ret - an array containing an array for each log message specifying the
   *        user, action, and timestamp
   */
  public function getLogs($search="%")
  {
    if( $search == "") {
        $search ="%";
    }
    $search = str_replace( "*", "%", $search );
    $search = '%'.$search.'%';
    $query = $this->connection->prepare("SELECT * FROM logs WHERE username LIKE ? OR action LIKE ? ORDER BY timestamp DESC");
    $query->bind_param('ss', $search, $search);

    $ret =  $this->executeSelectQuery($query);
    $query->close();
    return $ret;
  }

  /**
   * Return a list of all users
   *
   * Parameters:
   * None
   *
   * Returns:
   * $ret - an array containing the username of each member
   */
  public function getAllUsers()
  {
    $ret = array();
    $query = $this->connection->prepare("SELECT username FROM members");

    // Take the name out of each row	
    $temp_ret = $this->executeSelectQuery($query);
    $query->close();
    for( $i = 0; $i < count($temp_ret); $i++ )
      {
    	array_push($ret, $temp_ret[$i][0]);
      }
    
    return $ret;

  }

  /**
   * Checks to see if a member exists in the database
   *
   * Parameters:
   * uname - the username to check
   *
   * Returns:
   * True - if member exists
   * False - otherwise
   */
   public function userExists($uname) {
    $query = $this->connection->prepare("SELECT username FROM members where username=?");
    $query->bind_param('s', $uname);
    $query_ret = $this->executeSelectQuery($query);
    $query->close();

    return count($query_ret) > 0;
   }

  /**
   * Return a list of the currently active users
   *
   * Parameters:
   * None
   *
   * Returns:
   * $ret - an array containing the username of each active member
   */
  public function getActiveUsers()
  {
    $query = $this->connection->prepare("SELECT username FROM spring_evals UNION SELECT username FROM freshman_evals");

     // Take the name out of each row	
    $temp_ret = $this->executeSelectQuery($query);
    $query->close();
    $ret = array();
    for( $i = 0; $i < count($temp_ret); $i++ )
      {
    	array_push($ret, $temp_ret[$i][0]);
      }
  
    return $ret;
  }

  /**
   * Return a list of members with on-floor status that are NOT currently
   * on the specified roster
   *
   * Parameters:
   * $current - true if looking at the current roster, else false
   *
   * Returns:
   * $ret - an array containing the usernames of appropriate member
   */
  public function getOnfloorEligibleUsers($current)
  {
    if( $current )
      {
	$year = 'current';
      }
    else
      {
	$year = 'next';
      }

    $query = $this->connection->prepare("SELECT username, housing_points FROM members WHERE on_floor=true AND members.username NOT IN (SELECT roommate1 FROM roster WHERE year=?) AND members.username NOT IN (SELECT roommate2 FROM roster WHERE year=?)");
    $query->bind_param('ss',$year, $year);

     // Take the name out of each row	
    $temp_ret = $this->executeSelectQuery($query);
    $query->close();
    $ret = array();
    for( $i = 0; $i < count($temp_ret); $i++ )
      {
    	array_push($ret, $temp_ret[$i]);
      }

    return $ret;
  }

  /**
   * Return a list of members with on-floor status that are NOT currently
   * on the roster or in the queue
   *
   * Parameters:
   * None
   *
   * Returns:
   * $ret - an array containing the usernames of appropriate member
   */
  public function getQueueEligibleUsers()
  {
    $query = $this->connection->prepare("SELECT username, housing_points FROM members WHERE on_floor=true AND members.username NOT IN (SELECT roommate1 FROM roster WHERE year='current') AND members.username NOT IN (SELECT roommate2 FROM roster WHERE year='current') AND members.username NOT IN (SELECT username FROM queue)");

     // Take the name out of each row	
    $temp_ret = $this->executeSelectQuery($query);
    $query->close();
    $ret = array();
    for( $i = 0; $i < count($temp_ret); $i++ )
      {
    	array_push($ret, $temp_ret[$i]);
      }

    return $ret;
  }

  /**
   * Returns the list of CSH committees
   *
   * Parameters:
   * None
   *
   * Return:
   * $ret - an array containing the name of each committee
   */
  public function getCommittees()
  {
    $query = $this->connection->prepare("SELECT DISTINCT committee_name FROM committees");

    // Take the name out of each row	
    $temp_ret = $this->executeSelectQuery($query);
    $query->close();
    $ret = array();
    for( $i = 0; $i < count($temp_ret); $i++ )
    {
    	array_push($ret, $temp_ret[$i][0]);
    }

    return $ret;
  }

  /**
   * Sets the head of a specified committee
   *
   * Parameters:
   * $committee - the committe to update
   * $new_head - the new committee head
   *
   * Returns: 
   * None
   */
  public function setCommitteeHead($committee_id, $new_head) {
    if( !$this->isEboard() ){
        return;
    }

    $query = $this->connection->prepare("UPDATE committees SET committee_head=? WHERE id=?");
    $query->bind_param('ss', $new_head, $committee_id);
    $this->executeQuery($query);
    $query->close();
    if ($this->connection->affected_rows == 0) {
        printf("'%d' is not a valid committee_id\n", $committee_id);
    }
    
    // Write logs
    $this->writeLog($_SERVER['WEBAUTH_USER'], 
                    "Made $new_head the head of a committee(id=$committee_id)");
  }

  /**
   * Returns a map of committees and their committee heads
   *
   * Parameters: None
   *
   * Returns: 
   * $ret - a map of committees and their committee heads
   */
  public function getCommitteeMap()
  {
    $query = $this->connection->prepare("SELECT id, committee_name, committee_head FROM committees");

    // Take the name out of each row	
    $temp_ret = $this->executeSelectQuery($query);
    $query->close();
    $ret = array();
    for( $i = 0; $i < count($temp_ret); $i++ )
    {
    	$ret[$temp_ret[$i][0]] = array();
        $ret[$temp_ret[$i][0]]['c_name'] = $temp_ret[$i][1];
        $ret[$temp_ret[$i][0]]['c_head'] = $temp_ret[$i][2];
    }

    return $ret;
  }

  /**
   * Returns a list of committee meetings the given member attended
   *
   * Parameters:
   * $uname - the name of the member
   *
   * Return:
   * $ret - an array of arrays. First slot contains the date, second contains
   *        the meeting name
   */
   public function getListCommMtgs($uname){
     $query = $this->connection->prepare("SELECT meeting_date, committee_name FROM attendance JOIN committees on ID=committee_id WHERE username=?");
     $query->bind_param('s', $uname);
     $ret = $this->executeSelectQuery($query);
     $query->close();
     return $ret;
   }

  /**
   * Returns the number of voting (on-floor or dues-paying off-floor) members
   *
   * Parameters:
   * None
   *
   * Return:
   * $ret - the number of voting members
   */
  public function getNumVotingMembers()
  {
    $results = array();
    $query = $this->connection->prepare("SELECT username FROM members WHERE voting=true");

    $results = $this->executeSelectQuery($query);
    $query->close();
    return count($results);
  }

  /**
   * Executes given query and returns the response
   *
   * Parameters:
   * $query - a string representation of the query to run
   *
   * Returns:
   * $ret - an array containing the query results
   */
  private function executeSelectQuery($query)
  {
    if( ! $query instanceof mysqli_stmt) {
        echo "executeSelectQuery called with not-a-mysqli_stmt";
    } 
    if($query->execute()){
        $resultMetaData = mysqli_stmt_result_metadata($query);
        if($resultMetaData){
            $stmtRow = array(); //this will be a result row returned from mysqli_stmt_fetch($stmt)   
            $rowReferences = array();  //this will reference $stmtRow and be passed to mysqli_bind_results 
            while ($field = mysqli_fetch_field($resultMetaData)) { 
                $rowReferences[] = &$stmtRow[$field->name]; 
            }
            mysqli_free_result($resultMetaData);
            $bindResultMethod = new ReflectionMethod('mysqli_stmt', 'bind_result'); 
            $bindResultMethod->invokeArgs($query, $rowReferences); //calls mysqli_stmt_bind_result($stmt,[$rowReferences]) using object-oriented style
            $result = array();
            while($query->fetch()){
                $row = array();
                foreach($stmtRow as $key => $value){  //variables must be assigned by value, so $result[] = $stmtRow does not work (not really sure why, something with referencing in $stmtRow)
                    #$row[$key] = $value;           
                    array_push($row, $value);
                }
                $result[] = $row;
            }
            mysqli_stmt_free_result($query);
        }
    }
    return $result;
  }

  /**
   * Executes the given query and checks for an error
   *
   * Parameters:
   * $query - a string representation of the query to run
   *
   * Returns:
   * None
   */
  public function executeQuery($query)
  {
    if( ! $query instanceof mysqli_stmt) {
        echo "Query: $query";
    }
    $result = $query->execute();
    if( !$result )
      {
	die("Could not query database: </br>".$this->connection->error);
      }
  }

  /**
   * Gets a given configuration value from the database
   *
   * Parameters:
   * $key - The name of the config value to lookup
   *
   * Returns:
   * $val - the value of the requested configuration option
   */
  public function getConfigValue($key)
  {
    $query= $this->connection->prepare("SELECT cfg_value FROM global_config WHERE cfg_key=?");   
    $query->bind_param('s', $key);
    $ret = $this->executeSelectQuery($query);
    $query->close();
    return $ret;
  }

  /**
   * Sets a given configuration value from the database
   *
   * Parameters:
   * $key - The name of the config value to lookup
   * $value - the new value of the config option
   *
   * Returns:
   * None
   */
  public function setConfigValue($key, $value)
  {
    if( !$this->isEval() ){
        return;
    }
    $query = $this->connection->prepare("UPDATE global_config SET cfg_value=? WHERE cfg_key=?");
    $query->bind_param('ss', $value, $key);
    return $this->executeQuery($query);
  }

  /**
   * Adds a given major project to the database
   *
   * Parameters:
   * $uname - the username of the person submitting the project
   * $committee - the committee that the project falls under
   * $pname - the name of the project being submitted
   * $description - the project description
   *
   * Returns:
   * None
   */
  public function addMajorProject($uname, $committee, $pname, $description)
  {
    $committee = $this->cleanString($committee);

    // Make sure no one is making up committees
    $valid_committees= $this->getCommittees();
    $retVal = in_array($committee, $valid_committees);
    
    // Ensure major project name uniqueness
    $query = $this->connection->prepare("SELECT project_name, project_committee from major_project");
    $projectData = $this->executeSelectQuery($query);
    $temp = array($pname,$committee);
    $retVal = $retVal && (! in_array($temp, $projectData));

    if($retVal) {
        $query = $this->connection->prepare("INSERT INTO major_project (username, project_committee, project_name, project_description) VALUES (?, ?, ?, ?)");
        $query->bind_param('ssss', $uname, $committee, $pname, $description);
        $this->executeQuery($query);
        $this->writeLog($_SERVER['WEBAUTH_USER'], "Submitted a major project.");
    }
    return $retVal;
  }

  /**
   * Adds a given conditional to the database
   *
   * Parameters:
   * $uname - the username of the person receiving the conditional
   * $description - the description of the assigned conditional
   * $deadline - the date that the conditional is due
   *
   * Returns:
   * None
   */
  public function addConditional($uname, $description, $deadline)
  {
    if( !$this->isEval() ){
        return;
    }
    $query = $this->connection->prepare("INSERT INTO conditionals (username, description, deadline) VALUES (?,?,?)");
    $query->bind_param('sss', $uname, $description, $deadline);

    $this->executeQuery($query);
    $this->writeLog($_SERVER['WEBAUTH_USER'], "Gave ".$uname." a conditional.");

  }

  /**
   * Credits each listed user with attendance at one committee meeting
   *
   * Parameters:
   * $mtg - the name of the meeting that the attendance is for
   * $users - an array of usernames for those at the meeting
   *
   * Returns:
   * None
   */
  public function addAttendance($mtg, $users, $date)
  {
      if( !$this->isEboard() ) {
          return;
      }
      $this->cleanString($mtg);
      $meetingRecordInsertQuery = $this->connection->prepare("INSERT INTO attendance (username, meeting_date, committee_id) VALUES (?,?,?)");
      $countUpdateQuery = $this->connection->prepare("UPDATE members SET committee_mtgs=? WHERE username=?");

      $getCommIdQuery = $this->connection->prepare("SELECT ID from committees WHERE committee_name = ?");
      $getCommIdQuery->bind_param('s', $mtg);
      $mtgID = $this->executeSelectQuery($getCommIdQuery);
      $getCommIdQuery->close();
      // Extract the actual value from the nested arrays
      $mtgID = $mtgID[0][0];
      // Get and update the committee meeting count for each user in the list
      for($i=0; $i < count($users); $i++)
      {
          $numMtgs = $this->userLookup($users[$i], "members", "committee_mtgs", true);
          $numMtgs++;

          $countUpdateQuery->bind_param('ss', $numMtgs, $users[$i]);
          $meetingRecordInsertQuery->bind_param('sss', $users[$i], $date, $mtgID);


          $this->executeQuery($countUpdateQuery);
          $this->executeQuery($meetingRecordInsertQuery);
      }

      $countUpdateQuery->close();
      $meetingRecordInsertQuery->close();
      // Log the action
      $this->writeLog($_SERVER["WEBAUTH_USER"], "Added attendance for ".$mtg.".");

  }

  /**
   * Adds technical seminar attendance for each user in the given list
   *
   * Parameters:
   * $name - the name of the seminar that the attendance is for
   * $users - an array of usernames for those at the seminar
   *
   * Returns:
   * None
   */
  public function addSeminarAttendance($name, $users)
  {
    if( !$this->isEboard() ){
        return;
    }
    foreach( $users as $uname )
      {
	// Update the number of seminars attended
	$numSems = $this->userLookup($uname, "freshman_evals", 
				     "numTechSems", true);
	$numSems++;
	
	$query = $this->connection->prepare("UPDATE freshman_evals SET numTechSems=? WHERE username=?");
        $query->bind_param('ss', $numSems, $uname);
	$this->executeQuery($query);

	// Update the list of seminars attended
	$sems = $this->userLookup($uname, "freshman_evals", "techSems", true);
	$sems = $sems." ".$name.",";

	$query = $this->connection->prepare("UPDATE freshman_evals SET techSems=? WHERE username=?");
        $query->bind_param('ss', $sems, $uname);
	$this->executeQuery($query);
      }

    // Log the action
    $this->writeLog($_SERVER["WEBAUTH_USER"], "Added seminar attendance for ".$name.".");
  }

  /**
   * Adds a given user to the housing queue
   *
   * Parameters:
   * $uname - the username of the new user
   * 
   * Returns:
   * None
   */
  public function addToQueue($uname)
  {
    if( !$this->isEval() ){
        return;
    }
    $query = $this->connection->prepare("INSERT INTO queue (username) VALUES (?)");
    $query->bind_param('s', $uname);
    
    $this->executeQuery($query);

    $this->writeLog($_SERVER['WEBAUTH_USER'], "Added ".$uname." to the queue.");
  }

  /**
   * Save the freshman evals form for that user
   *
   * Parameters:
   * username and all of the fields for the form
   *
   * Returns:
   * None
   */
  public function saveFreshEvalForm($uname, $soc_pass, $soc_att, $comments)
  {
    // The user already exists in the table, so update the fields
    $query = $this->connection->prepare("UPDATE freshman_evals SET numSocEvents=?, socEvents=?, comments=? WHERE username=?");
    $query->bind_param('ssss', $soc_pass, $soc_att, $comments, $uname);

    $this->executeQuery($query);
  }
  /**
   * Save the winter evals form, either inserting a new one or updating a 
   * previously saved version
   *
   * Parameters:
   * username and all of the fields for the winter evals
   *
   * Returns:
   * None
   */
  public function saveWinterEvalForm($uname, $soc_att, $soc_host, 
				      $sem_att, $sem_host, $projects, $comments)
  {
    $save_selectWinterEvalQuery = $this->connection->prepare("SELECT username FROM winter_evals WHERE username=?");
    $save_updateWinterEvalQuery = $this->connection->prepare("UPDATE winter_evals SET social_attended=?, social_hosted=?, seminars_attended=?, seminars_hosted=?, projects=?, comments=? WHERE username=?");
    $save_insertWinterEvalQuery = $this->connection->prepare("INSERT INTO winter_evals VALUES (?,?,?,?,?,?,?,?)");

    // Check to see if that user already has a form saved
    $query = $save_selectWinterEvalQuery;
    $query->bind_param('s', $uname);
    $result = $this->executeSelectQuery($query);
    $save_selectWinterEvalQuery->close();

    // If the user already has a form, update it
    if($result)
      {
	$query = $save_updateWinterEvalQuery;
        $query->bind_param('sssssss', $soc_att, $soc_host, $sem_att, $sem_host, $projects, $comments, $uname);
      }
    // Otherwise, insert a new row
    else
      {
	$query = $save_insertWinterEvalQuery;
        $zero = 0;
        $query->bind_param('sssssssi', $uname, $soc_att, $soc_host, $sem_att, $sem_host, $projects, $comments,$zero);

      }
     
    $this->executeQuery($query);
    $save_updateWinterEvalQuery->close();
    $save_insertWinterEvalQuery->close();
  }

  /**
   * Saves House Meeting attendance, either updating or inserting a new row
   *
   * Parameters:
   * $date - the date of the house meeting
   * $results - an array containing the attendance informaton, one row
   *            for each member containing: username, present (t/f), 
   *            absent (t/f), excused (t/f), and comments
   * 
   * Returns:
   * None
   *
   */
  public function saveHMAttendance($date, $results)
  {
    if( !$this->isEval() ){
        return;
    }
    $updateHouseMeetingsQuery = $this->connection->prepare("UPDATE house_meetings SET present=?, excused=?, comments=? WHERE date=? AND username=?");
    $insertHouseMettingsQuery = $this->connection->prepare("INSERT INTO house_meetings VALUES (?,?,?,?,?)");
    $deleteHouseMeetingQuery = $this->connection->prepare("DELETE from house_meetings WHERE date=? AND username=?");
    $findEntryQuery = $this->connection->prepare("SELECT username FROM house_meetings WHERE date=? AND username=?");
    // Loop over each of the results
    for( $i = 0; $i < count($results); $i++ )
      {
        $findEntryQuery->bind_param('ss', $date, $results[$i][0]);
        $result = $this->executeSelectQuery($findEntryQuery);

        if( !empty( $result ) )
        {
            // This check is at one of the checkboxes was checked
            if( $results[$i][1] || $results[$i][2] || $results[$i][3]) { 
                // Start by trying to update the current record
                $updateHouseMeetingsQuery->bind_param('iisss', $results[$i][1], $results[$i][3], $results[$i][4], $date, $results[$i][0]);
                $this->executeQuery($updateHouseMeetingsQuery);
            } else {
                $deleteHouseMeetingQuery->bind_param('ss', $date, $results[$i][0]);
                $this->executeQuery($deleteHouseMeetingQuery);
            }
        } 
        else if( $results[$i][1] || $results[$i][2] || $results[$i][3] )
        {
            // If the update didn't take, insert a new row if appropriate.
            $insertHouseMettingsQuery->bind_param('ssiis', $results[$i][0], $date, $results[$i][1], $results[$i][3], $results[$i][4]);
            $this->executeQuery($insertHouseMettingsQuery);
        }
      }

    $updateHouseMeetingsQuery->close();
    $insertHouseMettingsQuery->close();
    $deleteHouseMeetingQuery->close();
    $findEntryQuery->close();
    $this->writeLog($_SERVER['WEBAUTH_USER'], "Updated House Meeting attendance for ".$date.".");
  }

  /**
   * Adds the given user to the specified roster for that particular room
   *
   * Parameters:
   * $uname - the name of the user to add
   * $room - the number of the room to add to
   * $slot - which slot within the room to place
   * $current - true if updating the current roster, else next year's
   *
   * Returns:
   * None
   */
  public function addToRoster($uname, $room, $slot, $current)
  {
    if( !$this->isEval() ){
        return;
    }
    // Determine which slot to update
    $column = "roommate".$slot;

    // Determine which year
    if( $current )
      {
	$ver = 'current';
      }
    else
      {
	$ver = 'next';
      }
    $query = $this->connection->prepare("UPDATE roster SET ".$column."=? WHERE room_number=? AND year=?");
    $query->bind_param('sss', $uname, $room, $ver);

    $this->executeQuery($query);

    // Write logs
    $this->writeLog($_SERVER['WEBAUTH_USER'], 
		    "Added ".$uname." to the roster.");
	     
  }

  /**
   * Add the given member to the spring eval table for the current year
   *
   * Parameters:
   * $uname - the username of the member
   *
   * Returns:
   *
   */
  public function addToSpring($uname)
  {
    // Add the member to the spring evals table
    $query = $this->connection->prepare("INSERT into spring_evals (username) VALUES (?)");
    $query->bind_param('s', $uname);
    $this->executeQuery($query);
  }
  
  /**
   * Delete the given member to the spring eval table for the current year
   *
   * Parameters:
   * $uname - the username of the member
   *
   * Returns:
   *
   */
  public function deleteFromSpring($uname)
  {
    // Delete the member to the spring evals table
    $query = $this->connection->prepare("DELETE from spring_evals WHERE username=?");
    $query->bind_param('s', $uname);
    $this->executeQuery($query);
  }

  /**
   * Deletes an attendance record for given member at given meeting
   *
   * Parameters:
   * $uname - the username of the member
   * $date - the date of the meeting
   * $meeting - the name of the meeting
   */
  public function deleteAttendence($uname, $date, $meeting) {
    
      $getCommIdQuery = $this->connection->prepare("SELECT ID from committees WHERE committee_name = ?");
      $getCommIdQuery->bind_param('s', $meeting);
      $mtgID = $this->executeSelectQuery($getCommIdQuery);
      $getCommIdQuery->close();
      // Extract the actual value from the nested arrays
      // var_dump($mtgID);
      $mtgID = $mtgID[0][0];

      $deleteAttendenceQuery = $this->connection->prepare("DELETE FROM attendance WHERE username=? AND meeting_date=? AND committee_id=?");
      $deleteAttendenceQuery->bind_param('ssi', $uname, $date, $mtgID);
      $this->executeQuery($deleteAttendenceQuery);
      $deleteAttendenceQuery->close();

      // now decrement the members committee meeting count
      $numMtgs = $this->userLookup($uname, "members", "committee_mtgs", true);
      $numMtgs--;
      $this->userUpdate($uname, "members", "committee_mtgs", $numMtgs);
  }

  /**
   * Deletes the user from the specified roster for that particular room 
   *
   * Parameters:
   * $uname - the username of the person being removed
   * $room - the number of the room to add to
   * $slot - which slot within the room to place
   * $current - true if updating the current roster, else next year's
   *
   * Returns:
   * None
   */
  public function removeFromRoster($uname, $room, $slot, $current)
  {
    if( !$this->isEval() ){
        return;
    }
    // Determine which slot to update
    $column = "roommate".$slot;

    // Determine which year
    if( $current )
      {
	$ver = 'current';
      }
    else
      {
	$ver = 'next';
      }

    $query = $this->connection->prepare("UPDATE roster SET ".$column."='' WHERE room_number=? AND year=?");
    $query->bind_param('ss', $room, $ver);
    $this->executeQuery($query);

    // Write logs
    $this->writeLog($_SERVER['WEBAUTH_USER'], 
		    "Removed ".$uname." from the roster.");
	     
  }

  /**
   * Update the result of the given evaluation
   * 
   * Parameters:
   * $uname - the member being evaluated
   * $eval - the specific evaluaiton
   * $result - the result of the evaluation
   *
   * Returns:
   * None
   */
  public function evalResult($uname, $eval, $result)
  {
    if( !$this->isEval() ){
        return;
    }
    // Update the status in the appropriate table
    $query = $this->connection->prepare("UPDATE ".$eval."_evals SET result = ? WHERE username = ?");
    $query->bind_param('ss', $result, $uname);

    $this->executeQuery($query);

    // Log the result
    $this->writeLog($_SERVER['WEBAUTH_USER'], $uname." received a ".$result." at ".$eval." evals.");
  }
 
  /**
   * Updates information about a major project
   *
   * Parameters:
   * $uname - the username of the project's owner
   * $mp_name - the name of the project
   * $committee - the committee the project falls under
   * 
   */
  public function updateMajorProject($uname, $mp_name, $committee, $description, $new_mp_name, $new_committee, $new_description){
    $query = $this->connection->prepare("UPDATE major_project SET project_name=?, project_committee=?, project_description=? WHERE project_name=? AND project_committee=? AND username=?");
    $query->bind_param('ssssss', $new_mp_name, $new_committee, $new_description, $mp_name, $committee, $uname);
    $this->executeQuery($query);
    $this->writeLog($_SERVER['WEBAUTH_USER'], "Updated their major project with new values: $new_mp_name, $new_committee, and $new_description.");
    $query->close();
  }

  /**
   * Records the result of a vote on a major project
   *
   * Parameters:
   * $uname - the username of the project's owner
   * $pname - the name of the project
   * $result - the result of the vote, either 'pass' or 'fail'
   *
   * Returns:
   * Nothing
   */
  public function voteMajorProject($uname, $pname, $status)
  {
    if( ! ($this->isEval() || (strcmp($uname, $_SERVER['WEBAUTH_USER']) == 0 && strcmp($status, "pending") == 0)) ) {
        return;
    }
    $pname = $this->cleanString($pname);
    $query = $this->connection->prepare("UPDATE major_project SET status=? WHERE username=? AND project_name=?"); 
    $query->bind_param('sss', $status, $uname, $pname);
    //mysql_real_escape_string($pname)."'";

    $this->executeQuery($query);
    $this->writeLog($_SERVER['WEBAUTH_USER'], $uname."'s project ".$pname." received a ".$status.".");
  }

  /**
   *
   */
  public function deleteMajorProject($uname, $pname, $committee)
  {
    if( ! ($this->isEval() || strcmp($_SERVER['WEBAUTH_USER'], $uname) == 0) ) {
        return;
    }
    $pname = $this->cleanString($pname);
    $uname = $this->cleanString($uname);
    $query = $this->connection->prepare("DELETE from major_project WHERE username=? AND project_name=? AND project_committee=?");
    $query->bind_param('sss', $uname, $pname, $committee);

    $this->executeQuery($query);
    $this->writeLog($_SERVER['WEBAUTH_USER'], "Deleted major project: $pname for committee $committee");
  }


  /**
   * Allows Financial to update voting status
   *
   */
  public function setVotingStatus($uname, $newState) {
    if( $this->isFinancial() || $this->isEval() ) {
       $query = $this->connection->prepare("UPDATE members SET voting=? WHERE username=?");
       $query->bind_param('ss', $newState, $uname);
       $this->executeQuery($query);

       if( $newState == false ){
           $this->deleteFromSpring($uname);
       }  else if( $newState == true){
           $haystack = $this->getEvaluees('spring');
           if( ! in_array($uname,$haystack) ) {
               $this->addToSpring($uname);
           }
       }

       $this->writeLog($_SERVER['WEBAUTH_USER'], "Updated ".$uname."'s voting status in members to $newState.");
    }
  }
    
  /**
   * Records the given information in the logs
   *
   * Parameters:
   * $uname - the name of the user performing the action
   * $action - description of the action being recorded
   *
   * Returns:
   * None
   */
  private function writeLog($uname, $action)
  {
    $action = $this->cleanString($action);
    $uname = $this->cleanString($uname);
    $query = $this->connection->prepare("INSERT INTO logs (username, action) VALUES (?,?)");
    $query->bind_param('ss', $uname, $action);
    $this->executeQuery($query);
  }

  /**
   * Checks if the currently logged-in user is an admin
   *
   * Parameters:
   * None
   *
   * Returns:
   * true is the logged-in user is listed in db_login.php as an admin
   */
   public function isAdmin()
   {
       for( $i = 0; $i < NUM_ADMINS; $i++ ) {
           if( defined("ADMIN$i") ) 
           {
               $curAdminEntry = constant("ADMIN$i");
               if(strcmp($curAdminEntry, $_SERVER['WEBAUTH_USER']) == 0) {
                   return true;
               }       
           }
       }
       return false;
   }

  /**
   * Checks to see if the currently logged-in user is the Eval director
   *
   * Parameters:
   * None
   *
   * Returns:
   * true if the given user is the eval director
   */
  public function isEval()
  {
    $ret = $this->select("committee_head", "committees", "committee_name", "Evaluations");

    if( $this->isAdmin() || (strcmp($ret[0][0], $_SERVER['WEBAUTH_USER']) == 0) )
      {
	return true;
      }
    else
      {
        $val = $this->getConfigValue('eval_running');
        if( strcmp($val[0][0], 0) ) {
            echo "</div><h1 style='float:none;margin-left:250px'>Edb is closed while an evaluation is in progress</h1>";
            exit();
        }
	return false;
      }
  }



  /**
   * Checks to see if the currently logged-in user is the Financial director
   *
   * Parameters:
   * None
   *
   * Returns:
   * true if the given user is the eval director
   */
  public function isFinancial()
  {
    $ret = $this->select("committee_head", "committees", "committee_name", 
			 "Financial");

    if( !strcmp($ret[0][0], $_SERVER['WEBAUTH_USER']) )
      {
	return true;
      }
    else
      {
	return false;
      }
  }

    /**
   * Checks to see if the currently logged-in user is a member of the Eboard
   *
   * Parameters:
   * None
   *
   * Returns:
   * true if the given user is on the Eboard
   */
  public function isEboard()
  {
    $query = $this->connection->prepare("SELECT committee_head FROM committees");
    $ret = $this->executeSelectQuery($query);
    $query->close();
    
    $current = $_SERVER['WEBAUTH_USER'];

    // Check the list of Eboard members
    foreach( $ret as $head )
      {
	if( strcmp($current, $head[0]) == 0)
	  {
	    return true;
	  }
      }
    
    if( $this->isAdmin() )
      {
	return true;
      }
    else
      {
	return false;
      }
  }
  
  /**
   * Cleans input string with local replace rules
   *
   * Parameters:
   * The string to clean
   *
   * Returns:
   * The cleaned string
   */
  public function cleanString($str)
  {
      $str = htmlentities($str);
      $str = preg_replace('/(?:\r\n[\r\n])/', PHP_EOL, $str);
      $str=mysqli_real_escape_string($this->connection,$str);

      return $str;
  }

  /**
   * Preps extracted content for display
   *
   * Parameters:
   * The string to prepare
   *
   * Returns:
   * A prepared version of the string
   */
   public function displayPrepString($str) {
       $cleanVal = strip_tags(str_replace(array("\\\\n","\\\\r", "\\n", "\\r", '\n', '\r'), "<br/>", html_entity_decode($str)), "<br/>");
       $cleanVal = preg_replace('/"/', '&quot;', $cleanVal);
       $cleanVal = preg_replace('/\\\/', '', $cleanVal);
       return $cleanVal;
   }
}

?>
