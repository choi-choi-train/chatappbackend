<?php

    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST");
    header("Access-Control-Allow-Headers: Content-Type");

    $conn = new mysqli("localhost", "new_user", "password", "chatappusers");

    if (mysqli_connect_error()) {
        echo(mysqli_connect_error());
        exit();
    }

    

?>