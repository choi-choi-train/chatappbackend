<?php
    require 'connect.php';
    header('Access-Control-Allow-Origin: http://localhost:8080');
    header('Access-Control-Allow-Origin: GET, POST, OPTIONS');
    header('Access-Control-Allow-Origin: Content-Type, Authorization');

    $postdata = file_get_contents('php://input');

    if (isset($postdata) && !empty($postdata)) {
        $request = json_decode($postdata);
        
        $username = $request -> username;
        $firstname = $request -> firstname;
        $lastname = $request -> lastname;
        $password = $request -> password;

        $sql = "INSERT INTO chatappusers (userName, firstName, lastName, pw) VALUES ('$username', '$firstname', '$lastname', '$password')";

        if (mysqli_query($connection, $sql)) {
            echo('SUCCESS');
            http_response_code(201);
        } else {
            echo('FAIL');
            http_response_code(422);
        }
    }
?>