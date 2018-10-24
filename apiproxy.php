<?php

    /* functions getContent and getUrl based off of https://davidwalsh.name/php-cache-function */
   
    /* Get contents of a request either from cache or via curl */
    function get_content( $url, $file = "", $speed_of_rot = 24) {

        /* Check if file argument has been given */
        /* Check if file is in cache             */
        /* Check if file has gone stale          */
        if( fromCache( $file ) && fresh( $file, $speed_of_rot ) ) {

            /* return contents directly from cache */
            return file_get_contents( fromCache( $file ) );
        }

        /* Else if file argument has been given */
        else if ( $file ) {

            /* Get url with curl, cache and return response */
            return toCache( $url, $file );
        }
        else{

            /* Only return response */
            return get_url( $url );
        }
    }

    /* Get content from curl */
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

    /* Get url, cache and return contents */
    function toCache( $url, $file, $path = ""){
        $content = get_url( $url );
        file_put_contents( "cache/" . $path . "/" . $file, $content);
        return $content;
    }

    /* Check if file is in cache, return cached location */
    function fromCache( $file, $path = ""){
        $cache = "cache/" . ($path ? $path . "/" : "" ) . $file;
        return $file && file_exists( $cache ) ? $cache : false;
    }

    /* Check if file has gone stale */
    function fresh( $file, $speed_of_rot = 24, $path = "" ){
        
        $now = time();
        $lastCached = filemtime( fromCache($file, $path) );
        $expirationTime = $speed_of_rot * 60 * 60;
        $freshness = $now - $lastCached;

        return $freshness < $expirationTime;
    }

    /* get content, decode and return response */
    function parse_curl($url, $cache, $info, $freshness){

        $raw = get_content( $url, $cache, $freshness );

        $response = json_decode( $raw );

        return array( "info"=>$info, "content"=> $response );
    }

    ////////////////////////////////////////////
    //                MAIN                    //
    ////////////////////////////////////////////

    /* Get arguments */
    $meta_request = $_GET["meta"];
    $direct_request = $_GET["direct"];

    $cache_response = $_GET["cache"];
    $info_response = json_decode($_GET["info"]);
    $freshness_response = $_GET["freshness"];

    /* Declare response(s) */
    $responses;

    /* If request is direct, get data directly from url */
    if ( $direct_request ){
        $responses = parse_curl( $direct_request, $cache_response, $info_response, $freshness_response );
    }

    /* Else the request is via a meta request. Open file and request further */
    else {

        /* Initialize responses as array */
        $responses = array();

        /* Open meta request and parse */
        $rl_file = file_get_contents( $meta_request );
        $request_list = json_decode($rl_file);

        /* Iterate over request list and request sequentially */
        foreach( $request_list as $request ){

            $item = parse_curl( $request->url, $request->cache, $request->info, $freshness_response );

            array_push($responses, $item);
            
        }
    }

    /* Return all responses */
    echo json_encode( $responses );

?>