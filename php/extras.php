<?PHP
function getTemperature($what_zip) {
	// The url of the site we're going to comb.
	$url = "http://thefuckingweather.com/?where=" . $what_zip;
	// Get the contents of the site.
	$file = file_get_contents($url);
	// Create a needle to search for in the data.
	$needle = '<temp_f data="';
	// Get an array of words between successive occurrences of the needle.
	$marray = explode($needle, $file);
	// Get an array of words between successive quotation marks.
	$marray2 = explode('"', $marray[1]);
	// Return the first word past that. Hopefully that is the temperature.
	return $marray2[0];
}
?>