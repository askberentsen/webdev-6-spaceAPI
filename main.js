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
async function init(){

    var articles = await apiProxy("webRequests.json", false );
    console.log( articles );

}

//////////////////////////////////////////////////////////////////
//		  Requests have been received. Handle apropriatly 		//
//////////////////////////////////////////////////////////////////
function handleResponse( response, index ){

    if ( response.content.error !== undefined ){
        /*Error handling*/
    }
    else if ( response.info.type === "latest" ){
        /*Get latest entry*/
        response.content = response.content[ response.content.length - 1 ];
    }
    else if ( response.info.type === "library"){
        /*Get library*/
    }

    console.log( "article #" + index );
    console.info( response );
}

function handleAllResponses( response ){
    console.info( "Finished loading " + response.length + " resources!" );
}