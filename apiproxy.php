<?php

    /* functions getContent and getUrl based off of https://davidwalsh.name/php-cache-function */
   
    /* Get contents of a request either from cache or via curl */
    function get_content( $url, $cache = true, $speed_of_rot = 24) {

        $file = fromCache( $url );
        /* Check if file argument has been given */
        /* Check if file is in cache             */
        /* Check if file has gone stale          */
        if( $file && fresh( $file, $speed_of_rot ) ) {
            /* return contents directly from cache */
            return file_get_contents( $file );
        }

        /* Else if file argument has been given */
        else if ( $cache === true ) {
            /* Get url with curl, cache and return response */
            return toCache( $url );
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
    function toCache( $url ){
        $content = get_url( $url );
        file_put_contents( "cache/" . md5( $url ) . ".dat", $content);
        return $content;
    }

    /* Check if file is in cache, return cached location */
    function fromCache( $url ){
        $cache = "cache/" . md5( $url ) . ".dat";
        return file_exists( $cache ) ? $cache : false;
    }

    /* Check if file has gone stale */
    function fresh( $file, $speed_of_rot = 24, $path = "" ){
        
        $now = time();
        $lastCached = filemtime( $file );
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
    $direct_url = $_GET["url"];

    $cache_response = boolval($_GET["cache"]);
    $info_response = json_decode($_GET["info"]);
    $freshness_response = $_GET["freshness"];

    $responses = parse_curl( $direct_url, $cache_response, $info_response, $freshness_response );
    

    /* Return all responses */
    echo json_encode( $responses );

?>