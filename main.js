/*I work 50/50 with VS-code and Atom. Indentation is correct in editor, but not necessairily in browser*/

//https://api.nasa.gov/
window.onload = init;

class ApiProxy {
    constructor( url ){
        this.url = url;
        this.cache = false;
        this.info = false;
        this.freshness = 24;
    }
    /* Get json from apiproxy */
    fetchJSON() {
        return fetch( this.form ).then( r => r.json() );
    }
    /* Generate form for apiproxy to handle */
    get form(){
        return "apiproxy.php?url=" + this.url
            + ( this.cache ? "&cache=" + this.cache : ""              )
            + ( this.info ? "&info=" + JSON.stringify(this.info) : ""   )
            + ( this.freshness ? "&freshness=" + this.freshness : ""    );
    }
    /* static all() is not a method of an instantiated ApiProxy */
    all( loadHandler ){

        var requests = this.url;

        var completion = 0;

        var proxyRequests = [];

        for ( var i = 0; i < requests.length; ++i ){

            let request = new ApiProxy( requests[i].url || requests[i] );

            request.cache = requests[i].cache || this.cache;
            request.freshness = requests[i].freshness || this.freshness;
            request.info = requests[i].info || this.info;

            proxyRequests.push( request.fetchJSON()
            .then( response => {
                completion += 100 / requests.length;
                loadHandler( completion );
                return response;
            } ) );
        }
        return Promise.all( proxyRequests );
    }
}

//////////////////////////////////////////////////////////////////
//					Initialize requests and DOM					//
//////////////////////////////////////////////////////////////////
var articles;

async function init(){

    /* Fetch the requests from json */
    var requestList = await fetch("webRequests.json").then( r => r.json() );

    var proxies = new ApiProxy( requestList );
    var promises = proxies.all( load ).then( finish );

    /*  Request all. Update loadingbar on response, and
        remove loading bar upon all complete responses  */

    /* wait for all requests to be completed */
    var articles = await promises;

    //var articles = await loadingBar( proxy.fetchJSON() );

    console.log( articles );

    main( articles );

}

function load( completion ){
    document.getElementById("loading_animation") .innerHTML = completion + "%";
}
function finish( response ){
    document.getElementById("loading").outerHTML = "";
    return response;
}

function main( jsonArray ){

    var main = document.getElementsByTagName("MAIN")[0];

    for( var i = 0; i < jsonArray.length; ++i ){

        writeArticle( main, jsonArray[i] );

    }

}

function writeArticle( location, json ){

    var article = document.createElement("article");

    json.content = json.info.type === "latest" ? json.content[ json.content.length - 1 ] : json.content;

    jTitle( article, json );

    jMedia( article, json );

    jSummary( article, json );

    //jDetails( article, json );

    //jFooter( article, json );

    location.appendChild(article);
}

function jTitle( article, json ){

    /* Instantiate nodes */
    var banner = document.createElement("header");
    var title = document.createElement("h2");

    /*  Extract title from json.  */
    /*  Different API responses have different structure, so if 
        none are found where expected, default to domain name  */
    var titleText = 
        json.content.title || 
        json.content.mission_name || 
        json.content.name || 
        json.content.ship_name || 
        json.info.domain;

    /*  Append title to banner */
    title.innerHTML = titleText;
    banner.appendChild( title );

    /*  Extract timestamp */
    /*  If no timestamp is given, don't add timestamp to article */
    var timeStamp = 
        json.content.date || 
        json.content.launch_date_utc || 
        json.content.event_date_utc || 
        json.content.year_built;

    if( timeStamp ){

        /* Append timestamp */
        var time = document.createElement("time");
        time.dateTime = timeStamp;

        timeUpdater( json, timeStamp, time );

        banner.appendChild( time );
    }

    /* Append title to article */
    article.appendChild( banner );
}

/*  Write summary if available  */
function jSummary( article, json ){

    var text = json.content.details || json.content.explanation;

    if ( text ){
        var summary = document.createElement("p");
        summary.innerHTML = text;
        article.appendChild( summary );
    }

}
//////////////////////////////////////
//          Media functions         //
//////////////////////////////////////

/*  Add image if available  */
function jMedia( article, json ){

    var media;
    
    /*  Extract image url(s) from json file where expected */
    var image = json.content.image || json.content.url || json.content.hdurl;
    var imageArray = json.content.flickr_images || (json.content.links ? json.content.links.flickr_images : undefined );

    /*  Check if json contains several images */
    if( imageArray ){

        media = addImages("", ...imageArray);

    }
    /*  Check if a single image was found instead */
    else if ( json.content.media_type === "image" || json.content.image ){

        media = addImages( "", image );

    }

    /*  If an image was found, append media to article */
    if( media ){
        article.appendChild( media );
    }
}

function addImages( caption, ...images ){
    var figure = document.createElement("figure");

    for( var i = 0; i < images.length; ++i ){

        var image = document.createElement("img");
        image.src = images[i];
        image.alt = "";

        figure.appendChild( image );
    }

    /* Use truthy to check if caption can be added */
    if ( caption ){

        var figCaption = document.createElement("figcaption");
        figCaption.innerHTML = caption;
    
        figure.appendChild(figCaption);

    }

    return figure;
}

////////////////////////////////////////////
//            Time functions              //
////////////////////////////////////////////

function updateTime( timeStamp, dateType ){
    var date = new Date(timeDifference(timeStamp));

    var yearsLeft = date.getUTCFullYear() - 1970;

    return (yearsLeft > 0 ? yearsLeft + " years, " : "")
        + date.getUTCMonth() + " months, "
        + date.getUTCDate() + " days, "
        + date.getUTCHours() + " hours, "
        + date.getUTCMinutes() + " minutes and "
        + date.getUTCSeconds() + " seconds left"
        + (dateType ? " until " + dateType : "");
}

function timeDifference( from, to = Date.now() ){
    return new Date( from ) - new Date(to);
}

function initializeTime( json, timeStamp ){
    var date = new Date( timeStamp );

    /* Spaghetti date extracter :^) */
    var relevantTime = String( date.getDate() ).padStart(2,0) 
        + "/" + String( date.getMonth() ).padStart(2,0) 
        + "/" + date.getFullYear();


    return (
        json.content.launch_date_utc ? "Launched: " + relevantTime : undefined ) ||
        (json.content.year_built ? "Built in " + date.getFullYear() : undefined) ||
        "Date: " + relevantTime;
}

function timeUpdater( json, timeStamp, timeObject ){

    /* If time is in the future update time regularly */
    if( json.content.is_tentative || timeDifference( timeStamp ) > 0 ){

        /* update on initialization */
        timeObject.innerHTML = updateTime( timeStamp, "launch" );

        /* Define an updater to be called every second */
        var updater = setInterval( function(){

            /* update time */
            timeObject.innerHTML =  updateTime(timeStamp, "launch" );

            /* If the time is in the past, set time to timeStamp and cancel updater */
            if ( timeDifference( timeStamp ) <= 0 ){

                clearInterval( updater );
                timeObject.innerHTML = timeStamp;
            }
        }, 800 );
    }
    /* Time is in the past, initialize timeObject to timeStamp */
    else {
        timeObject.innerHTML = initializeTime( json, timeStamp );
    }

}