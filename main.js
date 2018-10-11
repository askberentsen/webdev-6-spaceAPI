                              
/*I work 50/50 with VS-code and Atom. Indentation is correct in editor, but not necessairily in browser*/

//https://api.nasa.gov/
window.onload = init;

//////////////////////////////////////////////////////////////////
// xmlhttp request object for handling multiple XMLHttpRequests	//
//////////////////////////////////////////////////////////////////
class RequestResponseHandler{

        var object = new RequestResponseHandler( requestObject, function(response,index), function(responses));
    constructor(requests, responseHandler, completionHandler){

        validateArguements(requests, responseHandler, completionHandler);

        this.handle             = responseHandler;
        this.completionHandle   = completionHandler;
        this.requestList        = requests;

        this.responses          = [];
        this.completions        = 0;
    }

    sendRequestList(){
        /*Iterate over requestList[i], and send asynchronous requests*/
        for( let i = 0; i < this.requestList.length; ++i){
            /*send request from requestList[]. When server responds, assign response to responses[]*/
            sendRequest( this.requestList[i].url, (response)=>{this.recieve(response, i)}, i );
        }
    }

    recieve( response, index ){
    
        /*Complete response. Increment completions counter*/
        this.completions++;
        
        /*add response to responses[]*/
        this.responses[ index ] = {
            info: this.requestList[ index ].info,
            content: response
        }

        /*send response to handler*/        
        this.handle(this.responses[ index ], index);

        /*if a completionhandler has been given, and all responses are handled, send to completionhandler*/
        if(this.completionHandle !== undefined && this.completions === this.requestList.length){
            this.completionHandle(this.responses);
        }
    }
}

class RequestObject{
    constructor(url, domain, info = {}){
        this.info = info;
        this.info.domain = domain;
        this.url = url;
    }
}

function validateArguements(requestObject, mandatoryCallback, optionalCallback){

    if (!(mandatoryCallback instanceof Function)){
        /*arguement responseHandler is not a valid function*/
        throw new Error('mandatory callback "'+ mandatoryCallback +'" is not a function');
    }
    else if(optionalCallback !== undefined && !(optionalCallback instanceof Function)){
        /*arguement completionHandler is defined and not a function*/
        throw new Error('optional callback "'+ optionalCallback +'" is defined, but not a function');
    }
    else if ( requestObject instanceof Array){
        /*requests are of Array type*/

        for( let i = 0; i < requestObject.length; ++i){
            if (requestObject[i].url === undefined){
                /*object is missing an url tag*/
                throw new Error("request object[" + i + "] (" + requestObject[i] + ") is missing an url attribute");
            }
        }
    }
    else {
        throw new Error('request object "'+requestObject+'" is not an array');
    }
}

function sendRequest(request, handle, index){

    /*Define new request*/
    let  requestObject = new XMLHttpRequest();

    /*Define handler for request completion*/
    requestObject.onload = function(){

        /*Response is OK*/
        if ( requestObject.status === 200 ){

            /*Handle response*/
            handle( JSON.parse(requestObject.responseText), index );
        }

        /*Response is not ok*/
        else {

            handle( {
                status: requestObject.status,
                message: requestObject.statusText
            }, index );
        }
    }
    
    /*send request*/
    requestObject.open("GET", request, true);
    requestObject.send();
    return requestObject;
}



//////////////////////////////////////////////////////////////////
//					Initialize requests and DOM					//
//////////////////////////////////////////////////////////////////
var xhttp;

function init(){

    sendRequest("webRequests.json", (jsonRequestList)=>{
        xhttp = new RequestResponseHandler(jsonRequestList, handleResponse, handleAllResponses);
        xhttp.sendRequestList();
    })

}

//////////////////////////////////////////////////////////////////
//		  Requests have been recieved. Handle apropriatly 		//
//////////////////////////////////////////////////////////////////
function handleResponse(response, index){
    console.log("article #" + index);
    console.info(response);
}

function handleAllResponses(response){
    console.info("Finished loading "+response.length +" resources!")
}