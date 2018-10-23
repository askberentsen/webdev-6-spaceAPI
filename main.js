/*I work 50/50 with VS-code and Atom. Indentation is correct in editor, but not necessairily in browser*/

//https://api.nasa.gov/
window.onload = init;

function apiProxy( url, direct = true, cache = false, info = false ){
    
    let request = "apiproxy.php?";
    
    request += (direct ? "direct=" : "meta=") + url;

    request += cache ? "&cache=" + cache : "";
    
    request += info ? "&info=" + info : "";

    return fetch( request ).then( r => r.json() );
}

//////////////////////////////////////////////////////////////////
//					Initialize requests and DOM					//
//////////////////////////////////////////////////////////////////
var articles;

async function init(){

    articles = await apiProxy("webRequests.json", false );
    console.log( articles );


    main( articles );

}

function main( jsonArray ){

    var main = document.getElementsByTagName("MAIN")[0];

    for( var i = 0; i < jsonArray.length; ++i ){

        writeArticle( main, jsonArray[i] );

    }

}

function writeArticle( location, json ){

    var article = document.createElement("article");

    var header = document.createElement("header");

    header.innerHTML = json.info.domain;

    article.appendChild( header );


    location.appendChild( article );

}