<?php
    echo('CONNECTING...');
    
    header("Access-Control-Allow-Origin: *");

    $servername = 'localhost';
    $username = 'root';
    $password = '';
    $database = 'chatapp';

    $connection = mysqli_connect($servername, $username, $password, $database);

    if ($connection -> connect_error) {
        echo('AGUUUUGUUGUHH');
        die('Connection Failed: ' . $connection -> connect_error);
    } else {
        echo('Connected Successfully!');
    }

?>