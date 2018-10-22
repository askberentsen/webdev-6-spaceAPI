<?php

    header("Content-type: application/json");
    $file = fopen("webRequests.json","r");
    $content = "";

    while( $line = fgets( $file )){
        $content .= $line;
    }
    $requests = json_decode( $content );

    $responses = array();

    foreach ( $requests as $request ){
        $url = $request->url;
        $file = fopen($url, "r");

        $response = "";

        while( $line = fgets( $file ) ){
            $response .= $line;
        }

        $item = array( "info"=> $request->info , "url"=> $request->url, "content"=> $response);

        array_push($responses, $item );
    }
    echo json_encode($responses);
?>