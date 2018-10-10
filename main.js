/*I work 50/50 with VS-code and Atom. Indentation is correct in editor, but not necessairily in browser*/

//https://api.nasa.gov/
window.onload = init;

//////////////////////////////////////////////////////////////////
// xmlhttp request object for handling multiple XMLHttpRequests	//
//////////////////////////////////////////////////////////////////
class RequestResponseHandler{
    /* 
        simplified syntax
        var object = new RequestResponseHandler(String, Function, optional Function);
        or
        var object = new RequestResponseHandler(Array, Function, optional Function);

        complete syntax
        var object = new RequestResponseHandler( url.JSON, function(response,index), function(responses));
        var object = new RequestResponseHandler( requestObject, function(response,index), function(responses));

        Sends a list of requests and sends the responses to the responseHandler.
        On completion of all requests, the complete list of responses is given to the completionHandler.

        The completionHandler is Optional, but the responseHandler is mandatory.
    */
    constructor(requests, responseHandler, completionHandler){

        /* Initialize attributes */
        this.handle             = responseHandler;
        this.completionHandle   = completionHandler;

        this.requestList        = [];
        this.responses          = [];
        this.completions        = 0;
        ////CONSTRUCTION ERROR HANDLING////
        {
            ////HANDLER ARG ERRORS////
            if (!(responseHandler instanceof Function)){
                /*arguement responseHandler is not a valid function*/
                throw 'TypeError: responseHandler "'+ responseHandler +'" is not a function';
            }
            else if(completionHandler !== undefined && !(completionHandler instanceof Function)){
                /*arguement completionHandler is defined and not a function*/
                throw 'TypeError: completionHandler "'+ responseHandler +'" is defined, but not a function';
            }

            ////REQUEST ARG ERRORS////
            if ( requests instanceof Array){
                /*requests are of Array type*/

                /*assign requests directly to requestList*/
                this.requestList = requests;
                this.request();
            }
            else if( typeof requests === "string" ){
                /*requests are of string type*/

                if (/\.JSON$/.test(requests)){
                    /*requests is a JSON file*/

                    this.sendRequest(requests, response => {
        
                        /*assign JSON list to xhttp list*/
                        this.requestList = response;
            
                        /*initiate requests*/
                        this.request();
                    });
                }
                else{
                    /*request is not a JSON file*/
                    throw 'TypeError: could not bootstrap requests with arguement "' + requests +'" (must be a .JSON file)';
                }
            }
            else {
                /*request is something else*/
                throw "TypeError: arguement is not a bootstrap string (to a .JSON file) or an array of requests"; 
            }
        }
    }
    request(){
        /*Iterate over requestList[i], and send asynchronous requests*/
        for( let i = 0; i < this.requestList.length; ++i){
            
            if (this.requestList[i].url !== undefined){
                /*send request from requestList[]. When server responds, assign response to responses[]*/
                this.sendRequest( this.requestList[i].url, (response)=>{this.recieve(response, i)} );
            }
            else{
                throw "MissingAttributeException: requestList[" + i + "] (" + this.requestList[i] + ") is missing an url attribute";
            }

        }
    }
    recieve( response, index ){
    
        /*Complete response. Increment counter*/
        ++this.completions;
        
        /*add response to responses[]*/
        this.responses[ index ] = {
            info: this.requestList[ index ].info,
            content: response
        }

        /*send response to handler*/        
        this.handle(this.responses[index], index);

        /*if a completionhandler has been given, and all responses are handled, send to completionhandler*/
        if(this.completionHandle !== undefined && this.completions === this.requestList.length){
            this.completionHandle(this.responses);
        }
    }
    sendRequest(request, handle, index){

        /*Define new request*/
        let  requestObject = new XMLHttpRequest();
    
        /*Define handler for request completion*/
        requestObject.onload = () => {
    
            /*Response is OK*/
            if ( requestObject.status === 200 ){
    
                /*Handle response*/
                handle( JSON.parse(requestObject.responseText), index );
            }
    
            /*Response is not ok*/
            else {
    
                /*Handle null for failed response*/
                handle( null, index );
            }
        }
        
        /*send request*/
        requestObject.open("GET", request, true);
        requestObject.send();
        return requestObject;
    }
}
class RequestObject{
    constructor(url, domain, info = {}){
        this.info = info;
        this.info.domain = domain;
        this.url = url;
    }
}


//////////////////////////////////////////////////////////////////
//					Initialize requests and DOM					//
//////////////////////////////////////////////////////////////////
var xhttp;
function init(){
    let request = new RequestObject("https://api.spacexdata.com/v3/launches", "SpaceX");
    xhttp = new RequestResponseHandler("webRequests.JSON", handleResponse, handleAllResponses);

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