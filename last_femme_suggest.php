<?php
error_reporting(0);
//Filter input against malicious requests
$artist = filter_var($_GET['artist'], FILTER_SANITIZE_STRING);
$size_get = $_GET['size'];

//URL_encode input
$artist = urlencode($artist);

//Last-fm api_key
$api_key = "INSERT_YOUR_KEY";

//Connect to Last.fm
$url = "http://ws.audioscrobbler.com/2.0/?method=artist.getimages&format=json&artist=". $artist ."&api_key=".$api_key;
//echo $url;

//Decode json, transform into an object
$last_fm_result = file_get_contents($url);
$last_fm_json = json_decode($last_fm_result, true);

//Create list of links to last.fm
echo "<ul class='group'>";

//Loop out each image
if (isset($last_fm_json["images"]["image"])) {
	foreach($last_fm_json["images"]["image"] as $image)
	{	
		foreach($image["sizes"] as $size) {
			if(isset($size_get)) {
				echo '<li><a href="'.$size[0]["#text"].'"><img src="'.$size[$size_get]["#text"].'" width="'.$size[$size_get]["width"].'" height="'.$size[$size_get]["height"].'" alt="'.$artist.'"></a></li>';
			} else {
				echo '<li><a href="'.$size[0]["#text"].'"><img src="'.$size[2]["#text"].'" width="'.$size[2]["width"].'" height="'.$size[2]["height"].'" alt="'.$artist.'"></a></li>';
			}
		}
		if ($image["title"] != "") {
			//echo '<li><a href="'.$image["url"].'">'.$image["title"].'</a></li>';
		}
	}
} else {
	echo '<li>Very sorry, couldn\'t find the thing you where looking for. Try to search for something else.</li>';
}
//echo "<li><a href='#header'>Go back up!</a></li>";
echo "</ul>";

// Future development: YouTube results as well.
//Get Youtube result
/*$youtube_result = simplexml_load_file($youtube);

echo "<pre>" . $youtube_result . "</pre>";
//Create list
echo "<ul class='group'>";
foreach ($youtube_result->entry() as $video)
	{
		echo "<li>" . $video->id() . "</li>"; 
	}
echo "</ul>";*/


//Cache

//Save some statistics like ip and artist
/*$con = mysql_connect('host',"database","password");
if (!$con)
{
  die('Could not connect: ' . mysql_error());
}
@mysql_select_db("database") or die("Unable to select database");
$ip = $_SERVER['REMOTE_ADDR'];
$query = "INSERT INTO last_fm (query, ip) VALUES('".$artist."', '".$ip."')";
mysql_query($query);*/

?>