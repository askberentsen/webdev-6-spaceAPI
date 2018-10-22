<?php

    header("Content-type: application/json");
    $file = fopen("webRequests.json","r");
    $content = "";

    while( $line = fgets( $file )){
        $content .= $line;
    }
    $requests = json_decode( $content );

    echo "[";

    foreach ( $requests as $request ){
        $url = $request->url;
        $file = fopen($url, "r");

        while( $line = fgets( $file ) ){
            echo $line;
        }

    }

    $req = $requests[0]->url;

    $file = fopen($req, "r");

    while( $line = fgets( $file )){
        echo $line;
    }

    echo "]";

?>