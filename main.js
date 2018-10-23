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

    var request = apiProxy("webRequests.json", false );

    var articles = await loadingBar( request );

    console.log( articles );

    main( articles );

}

function loadingBar( promise ){

    /*  Get loading bar  */
    var bar = document.getElementById("loading_animation");

    /*  Animate loading bar  */
    var animation = setInterval( ()=>{

        switch( bar.innerHTML ){
            case ".": 
                bar.innerHTML = ".."; 
                break;
            case "..": 
                bar.innerHTML = "..."; 
                break;
            default: 
                bar.innerHTML = "."; 
                break;
        }
    }, 300);

    /* return promise, and when promise is resolved, clear animation */
    return promise.then( result => {

        clearInterval( animation );
        document.getElementById("loading").outerHTML = "";

        return result;

    });
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

/*  Add image if available  */
function jMedia( article, json ){

    var media;
    
    /*  Extract image url(s) from json file where expected */
    var image = json.content.image || json.content.hdurl || json.content.url;
    var imageArray = json.content.flickr_images || (json.content.links ? json.content.links.flickr_images : undefined );

    var type = json.content.media_type;

    /*  Check if json contains several images */
    if( imageArray ){

        /*  instantiate image wrapper  */
        media = document.createElement("figure");

        /*  for each image in array, append to wrapper */
        for( var i = 0; i < imageArray.length; ++i ){
            image = document.createElement("img");
            image.src = imageArray[i];
            media.appendChild( image );
        }

    }
    /*  Check if a single image was found instead */
    else if ( type === "image" || json.content.image ){

        media = document.createElement("img");
        media.src = image;

    }

    /*  If an image was found, append media to article */
    if( media ){
        article.appendChild( media );
    }
}


function updateTime( timeStamp, dateType ){
    var date = new Date(timeDifference(timeStamp));

    var yearsLeft = date.getUTCFullYear() - 1970;

    return (yearsLeft > 0 ? yearsLeft + " years, " : "") +
        date.getUTCMonth() + " months, " +
        date.getUTCDate() + " days, " +
        date.getUTCHours() + " hours, " +
        date.getUTCMinutes() + " minutes and " +
        date.getUTCSeconds() + " seconds left" +
        (dateType ? " until " + dateType : "");
}

function timeDifference( from, to = Date.now() ){
    return new Date( from ) - new Date(to);
}

function initializeTime( json, timeStamp ){
    return (
        json.content.launch_date_utc ? "Launched: " + timeStamp : undefined ) ||
        json.content.year_built ? "Built in " + timeStamp : undefined ||
        "Date: " + timeStamp;
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