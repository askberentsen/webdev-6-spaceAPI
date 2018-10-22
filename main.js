/*I work 50/50 with VS-code and Atom. Indentation is correct in editor, but not necessairily in browser*/

//https://api.nasa.gov/
window.onload = init;

//////////////////////////////////////////////////////////////////
// xmlhttp request object for handling multiple XMLHttpRequests	//
//////////////////////////////////////////////////////////////////
class RequestResponseHandler{

    constructor( requests, responseHandler, completionHandler ){

        validateArguements( requests, responseHandler, completionHandler );

        this.handle             = responseHandler;
        this.completionHandle   = completionHandler;
        this.requestList        = requests;

        this.responses          = [];
        this.completions        = 0;
    }

    sendRequestList(){

        let requests = [];

        for( let i = 0; i < this.requestList.length; ++i){
            requests.push( new Promise( resolve => {
                sendRequest( this.requestList[i].url, resolve);
            } ) )
        }

        return Promise.all(requests);


        /* Iterate over requestList[i], and send asynchronous requests */
        // for( let i = 0; i < this.requestList.length; ++i ){
        //     /* send request from requestList[]. When server responds, assign response to responses[] */
        //     sendRequest( this.requestList[i].url, response => { this.receive( response, i ) }, i );
        // }
    }

    receive( response, index ){
    
        /* Complete response. Increment completions counter */
        this.completions++;
        
        /* add response to responses[] */
        this.responses[ index ] = {
            info: this.requestList[ index ].info,
            content: response
        }

        /* send response to handler */
        this.handle( this.responses[ index ], index );

        /* if a completionhandler has been given, and all responses are handled, send to completionhandler */
        if( this.completionHandle !== undefined && this.completions === this.requestList.length ){
            this.completionHandle( this.responses );
        }
    }
}

class RequestObject{
    constructor( url, domain, info = {}){
        this.info = info;
        this.info.domain = domain;
        this.url = url;
    }
}

function validateArguements( requestObject, mandatoryCallback, optionalCallback ){

    if ( !( mandatoryCallback instanceof Function ) ){
        /* arguement responseHandler is not a valid function */
        throw new Error( 'mandatory callback "' + mandatoryCallback + '" is not a function' );
    }
    else if( optionalCallback !== undefined && !( optionalCallback instanceof Function ) ){
        /* arguement completionHandler is defined and not a function */
        throw new Error( 'optional callback "' + optionalCallback + '" is defined, but not a function' );
    }
    else if ( requestObject instanceof Array ){
        /* requests are of Array type */

        for( let i = 0; i < requestObject.length; ++i ){
            if ( requestObject[i].url === undefined ){
                /* object is missing an url tag */
                throw new Error( "request object[" + i + "] (" + requestObject[i] + ") is missing an url attribute" );
            }
        }
    }
    else {
        throw new Error( 'request object "' + requestObject + '" is not an array' );
    }
}

function sendRequest( request, handle, index ){

    /* Define new request */
    let  requestObject = new XMLHttpRequest();

    /* Define handler for request completion */
    requestObject.onload = function(){

        let response = JSON.parse( requestObject.responseText );
        response.status = requestObject.status;

        /* Send response to handler */
        handle( response, index );
    }
    
    /* send request */
    requestObject.open( "GET", request, true );
    requestObject.send();
    return requestObject;
}

//////////////////////////////////////////////////////////////////
//					Initialize requests and DOM					//
//////////////////////////////////////////////////////////////////
async function init(){

    var articles = await fetch( "webRequests.json" )
    .then( response => response.json() )
    .then( response => {
        let xhttp = new RequestResponseHandler( response, handleResponse, handleAllResponses );
        return xhttp.sendRequestList();
    });
    console.log( articles );

    // var articles = await new Promise( resolve => {
    //     /*Await until all responses have been handled*/
        
    //     sendRequest( "webRequests.json", jsonRequestList => {
    //         /*Request a requestlist from "webrequests.json"*/

    //         xhttp = new RequestResponseHandler( jsonRequestList, handleResponse, resolve );
    //         /*Send in requestlist, handleResponse and resolve to constructor*/
    //         /*On completion of all requests, resolve promise with an array of all responses*/

    //         xhttp.sendRequestList();
    //         /*Send all requests*/
    //     });
    // });

    console.log(articles);

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