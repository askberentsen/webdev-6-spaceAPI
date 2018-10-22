<?php

    /* functions getContent and getUrl from https://davidwalsh.name/php-cache-function */
    function get_content( $file, $url, $speed_of_rot = 24) {

        if( fromCache( $file ) && expired( $file, $speed_of_rot ) ) {
            return file_get_contents( fromCache( $file ) );
        }
        else {
            return toCache( $url, $file );
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

    
    $meta_request = $_GET["request"];
    $rl_file = file_get_contents( $meta_request );
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