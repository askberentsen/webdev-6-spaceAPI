<?php

    /* functions getContent and getUrl from https://davidwalsh.name/php-cache-function */
    function get_content($file,$url,$hours = 24,$fn = '') {

        //vars
        $current_time = time(); 
        $expire_time = $hours * 60 * 60; 
        $file_time = filemtime($file);
        //decisions, decisions
        if( file_exists( "cache/" . $file ) && ($current_time - $expire_time < $file_time) ) {
            return file_get_contents($file);
        }
        else {
            $content = get_url( $url );
            if($fn) { $content = $fn( $content ); }
            file_put_contents( "cache/" . $file , $content);
            return $content;
        }
    }
    function get_url( $url ) {

        $curl = curl_init();

        curl_setopt_array($curl, array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => "",
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CUSTOMREQUEST => "GET",
        ));

        $response = curl_exec( $curl );
        $err = curl_error( $curl );

        curl_close( $curl );

        if ( $err ) {
            return "cURL Error #:" . $err;
        } else {
            return $response;
        }
    }

    

    $rl_file = file_get_contents("webRequests.json");
    $request_list = json_decode($rl_file);

    $responses = array();

    foreach( $request_list as $request ){

        $raw = get_content( $request->cache, $request->url );

        $response = json_decode( $raw );

        $item = array( "info"=>$request->info, "url"=> $request->url, "content"=> $response );

        array_push($responses, $item);
        
    }

    echo json_encode( $responses );

?>