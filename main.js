"use strict";

window.onload = init;

/* Use ApiProxy to request cross domain and potentially cache */
/* Returns a new promise */
class ApiProxy {
    constructor( arg ){
        this.url = arg.url || arg;
        this.cache = arg.cache || false;
        this.info = arg.info || false;
        this.freshness = arg.freshness || 8;
        return this;
    }
    /* Get json from apiproxy */
    fetchJSON() {
        return fetch( this.form ).then( r => r.json() );
    }
    static fetchJSON( arg ){
        let request = new ApiProxy( arg );
        return request.fetchJSON();
    }
    /* Generate form for apiproxy to handle */
    get form(){
        return "apiproxy.php?url=" + this.url
            + ( this.cache ? "&cache=" + this.cache : ""              )
            + ( this.info ? "&info=" + JSON.stringify(this.info) : ""   )
            + ( this.freshness ? "&freshness=" + this.freshness : ""    );
    }
}

/* Use ApiProxyArray to request many ApiProxy requests */
/* Returns a new promise */
class ApiProxyArray {
    constructor ( requestArray ){
        this.requestList = requestArray;
        return this;
    }
    all( progressionCallback = ()=>{}, modifier = r => r ){

        var completion = 0;

        var promises = [];

        for ( var i = 0; i < this.requestList.length; ++i ){

            promises.push( ApiProxy.fetchJSON( this.requestList[i] )
                .then( modifier )
                .then( response => {
                    completion += 100 / this.requestList.length;
                    progressionCallback( completion );
                    return response;
                } )
            );
        }
        return Promise.all( promises );
    }
}

//////////////////////////////////////////////////////////////////
//					Initialize requests and DOM					//
//////////////////////////////////////////////////////////////////
var main;
var articles;
var position = 0;

async function init(){

    /* Fetch the requests from json */
    var requests = await fetch("webRequests.json")
        .then( response => response.json() )
        .then( response => { return new ApiProxyArray( response ) } );

    main = document.getElementsByTagName("main")[ 0 ];
    /* The following code also works, but the native fetch function is faster */
    // var proxies = await ApiProxy("webRequests.json")
    //     .then( response => { return new ApiProxyArray( response ) } );

    var banner = document.getElementById("banner");
    window.addEventListener("scroll", (e)=>{
        if ( window.scrollY > 25 ){
            banner.dataset.scroll = true;
        }else{
            banner.dataset.scroll = false;
        }
    });

    articles = await requests.all( load ).then( finish );
    console.log( articles );
    
    for( let article of articles ){
        main.appendChild( (new DOMGenerator( article )).create() );
    }

}

function load( completion ){
    document.getElementById("loading_animation") .innerHTML = completion.toFixed(0) + "%";
    document.body.dataset.loading = completion.toFixed(0);
}
function finish( response ){
    document.getElementById("loading").outerHTML = "";
    delete document.body.dataset.loading;
    return response;
}