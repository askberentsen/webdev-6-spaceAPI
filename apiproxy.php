<?php

    /* functions getContent and getUrl from https://davidwalsh.name/php-cache-function */
    function get_content( $url, $file = "", $speed_of_rot = 24) {

        if( $file && fromCache( $file ) && expired( $file, $speed_of_rot ) ) {
            return file_get_contents( fromCache( $file ) );
        }
        else if ( $file ) {
            return toCache( $url, $file );
        }
        else{
            return get_url( $url );
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
    function toCache( $url, $file, $path = ""){
        $content = get_url( $url );
        file_put_contents( "cache/" . $path . "/" . $file, $content);
        return $content;
    }
    function fromCache( $file, $path = ""){
        $cache = "cache/" . $path . "/" . $file;
        return file_exists( $cache ) ? $cache : false;
    }

    function expired( $file, $speed_of_rot = 24, $path = "" ){
        
        $now = time();
        $lastCached = filemtime( fromCache($file, $path) );
        $expirationTime = $speed_of_rot * 60 * 60;
        $freshness = $now - $lastCached;

        return $freshness < $expirationTime;
    }

    function parse_curl($url, $cache, $info){

        $raw = get_content( $url, $cache );

        $response = json_decode( $raw );

        return array( "info"=>$info, "content"=> $response );
    }

    
    $meta_request = $_GET["meta"];
    $direct_request = $_GET["direct"];

    $cache_response = $_GET["cache"];
    $info_response = $_GET["info"];

    $responses;

    if ( $direct_request ){
        $responses = parse_curl( $direct_request, $cache_response, $info_response );
    }
    else {
        $responses = array();
        $rl_file = file_get_contents( $meta_request );
        $request_list = json_decode($rl_file);


        foreach( $request_list as $request ){

            $item = parse_curl( $request->url, $request->cache, $request->info);

            array_push($responses, $item);
            
        }
    }

    echo json_encode( $responses );

?>