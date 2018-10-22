/*I work 50/50 with VS-code and Atom. Indentation is correct in editor, but not necessairily in browser*/

//https://api.nasa.gov/
window.onload = init;

//////////////////////////////////////////////////////////////////
//					Initialize requests and DOM					//
//////////////////////////////////////////////////////////////////
async function init(){

    var articles = await fetch( "apiproxy.php" )
    .then( response => response.json() )
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