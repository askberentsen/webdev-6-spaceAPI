"use strict";
/*I work 50/50 with VS-code and Atom. Indentation is correct in editor, but not necessairily in browser*/

//https://api.nasa.gov/
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
var articles;

async function init(){

    /* Fetch the requests from json */
    var requests = await fetch("webRequests.json")
        .then( response => response.json() )
        .then( response => { return new ApiProxyArray( response ) } );

    /* The following code also works, but the native fetch function is faster */
    // var proxies = await ApiProxy("webRequests.json")
    //     .then( response => { return new ApiProxyArray( response ) } );

    articles = await requests.all( load ).then( finish );

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

//////////////////////////////////////////////////////////////////
//                        Write articles                        //
//////////////////////////////////////////////////////////////////

function main( jsonArray ){

    var main = document.getElementsByTagName("MAIN")[0];

    for( let json of jsonArray ){

        main.appendChild( writeArticle( json ) );

    }

}

function writeArticle( json ){

    /* Define all the elements that are independent of API response */
    let article = document.createElement("article");

    /* Define nodes */
    let banner      = createBanner      ( json );
    let navigation  = createNavigation  ( json );
    let sections    = createSections    ( json );
    let footer      = createFooter      ( json );
    
    /* Append nodes */
    article.appendChild( banner );
    if ( navigation ) { 
        article.appendChild( navigation );
    }

    for ( let section of sections ){
        article.appendChild( section );
    }
    article.appendChild( footer );

    // initializeArticle( article, json );

    return article;

}

function createBanner( json ){

    /* Define all nodes */
    let banner      = document.createElement( "header" );
    let header      = document.createElement( "h2"     );
    let title       = document.createElement( "span"   );
    let subtitle    = document.createElement( "span"   );

    /* Append nodes */
    banner.appendChild( header   );
    header.appendChild( title    );
    header.appendChild( subtitle );

    /* Populate attributes */
    banner  .classList.add( "article_header"     );
    header  .classList.add( "article_title"      );
    title   .classList.add( "article_title_text" );
    subtitle.classList.add( "article_subtitle"   );
    
    /* Populate nodes */
    title.innerHTML = json.info.title || json.content.title || json.content.name || json.content.mission_name;

    /* Return node */
    return banner;
}

function createNavigation( json ){

    /* If navigation is not needed, return nothing */
    if ( !( json.info.sections && json.info.sections.length > 1) ){
        return null;
    }
    else {
        /* Define nav node */
        let navigation = document.createElement("nav");

        for( let section of json.info.sections ){

            /* Define menu item node */
            let menuItem = document.createElement("button");

            /* Append node */
            navigation.appendChild( menuItem );

            /* Populate node */
            menuItem.onclick                = switchSection                ;
            menuItem.innerHTML              = section                      ;
            menuItem.dataset.selected       = false                        ;
            menuItem.dataset.targetId       = json.info.id + "_" + section ;
            menuItem.dataset.targetName     = json.info.id                 ;
            menuItem.setAttribute ( "name",   json.info.id + "_button"    );
        }

        return navigation;
    }
}

function createSections( json ){

    /* If several sections are available, iterate through that, else iterate once with key "normal" */
    let population = json.info.sections || {"normal":"normal"};

    let nodeList = [];

    /* Iterate through population and create sections */
    for ( let type in population ){
        let typeInfo = population[ type ];

        let relevantJson = limitJson( json, type );

        /* Define node */
        let section = document.createElement( "section" );

        /* Append node */
        nodeList.push( section );

        /* Populate attributes */
        section.classList.add ( "section_" + type  );
        section.id = ( json.info.id + "_" + type   );
        section.setAttribute( "name", json.info.id );

        /* Populate node */

        switch ( type ){
            case "all":
                /* Define Table */
                let table = document.createElement("table");

                /* Define Collumn headers */
                let collumnHeader = document.createElement("tr");

                for ( let name in typeInfo ){

                    let header = document.createElement("th");
                    header.innerHTML = name;
                    collumnHeader.appendChild( header );
                }
                table.appendChild(collumnHeader);

                /* Define Table items */
                for ( let item of relevantJson ){

                    /* Define Row */
                    let row = document.createElement("tr");

                    for ( let cellType in population[ type ] ){
                        let cellItem = population[ type ][ cellType ];
                        let cell;

                        if ( cellType === "Launches" || cellType === "Title" || cellType === "Articles" ){
                            cell = document.createElement( "th" );
                        }
                        else {
                            cell = document.createElement( "td" );
                        }

                        let cellText = item[ cellItem ];
                        cell.innerHTML = cellText;
                        row.appendChild(cell);

                    }

                    table.appendChild( row );
                }
                section.appendChild( table );
                break;
            default:
                section.innerHTML = relevantJson.details || relevantJson.explanation;
                break;
        }


    }
    return nodeList;
}

function createFooter( json ){

    /* Define node */
    let footer = document.createElement( "footer" );

    /* Populate attributes */

    /* Populate node */
    footer.innerHTML = "Hello World!";

    return footer;
}

function switchSection( evt ){

    /* Get sections of article */
    let selectedSection    = document.getElementById   ( this.dataset.targetId   );
    let unselectedSections = document.getElementsByName( this.dataset.targetName );
    let unselectedButtons  = document.getElementsByName( this.name               );

    /* For each section that isn't selected, hide */
    for ( let node of unselectedSections ){
        node.dataset.visible = false;
    }
    /* For each button that isn't selected, unselect */
    for ( let button of unselectedButtons ){
        button.dataset.selected = false;
    }
    /* Show selected section and select button */
    selectedSection.dataset.visible = true;
    this.dataset.selected = true;
}

function limitJson( json, type ){
    switch ( type ){
        case "latest":
        case "last":
        case "newest":
            return json.content[ json.content.length - 1 ];
        case "first":
        case "next":
        case "oldest":
            return json.content[ 0 ];
        default:
            return json.content;
    }
}









    // /* If the json calls for sections, create these sections */
    // if ( json.info.sections && json.info.sections.length > 1 ){

    //     navigation = document.createElement("nav");
    //     article.appendChild( navigation );

    //     for( let i = 0; i < json.info.sections.length; ++i ){

    //         let sectionName = json.info.sections[i];

    //         /* Add button, and the onclick event that updates the visible section, and changes the selected button */

    //         let menuItem = jButton( sectionName, function(){
    //             updateArticle( article, index => index === i );
    //         } );
            
    //         navigation.appendChild( menuItem );
            
    //         /* Instantiate a new section */
    //         let section = jSection( json, sectionName )

    //         /* Add the sectionname to the classlist so it can be found by other functions */
    //         section.classList.add( sectionName );

    //         /* Actual contents of section */
    //         article.appendChild( section );

    //     }
    //     updateArticle( article, index => index === 0 );
    // }
    // else {
    //     let section = jSection( json, "normal");

    //     article.appendChild( section );
    // }
    // return article;
//}

function jSection( json, type ){
    let section = document.createElement("section");
    let header;
    // if ( type !== "normal"){
    //     header = document.createElement("h2");
    //     section.appendChild(header);
    // }

    switch ( type ){
        case "normal":
            break;
        case "next": //do something
        case "first":
            section.dataset.timestamp = timeStamp( json.content[0] );
            //section.innerHTML = "next article";
            break;
        case "all": //do something
            //section.innerHTML = "all article";
            break;
        case "newest": //do something
        case "latest":
        case "last":
            section.dataset.timestamp = timeStamp( json.content[ json.content.length - 1 ] );
            //section.innerHTML = "newest article";
            break;
        default:
            //section.innerHTML = "normal article";
            break;

    }
    return section;
}

function jTitle( json ){

    /* Instantiate nodes */
    let banner = document.createElement("header");
    let title = document.createElement("h2");
    let subtitle = document.createElement("span");
    let time = document.createElement("time");


    banner.classList.add("article_header");
    subtitle.classList.add("subtitle");
    time.classList.add("timestamp");
    time.dataset.visible = false;
    time.dateTime = timeStamp( json.content );

    /*  Extract title from json.  */
    /*  Different API responses have different structure, so if 
        none are found where expected, default to domain name  */
    let titleText = 
        json.info.title ||
        json.content.title || 
        json.content.mission_name || 
        json.content.name || 
        json.content.ship_name;

    /*  Append title to banner */
    title.innerHTML = titleText;
    banner.appendChild( title );
    banner.appendChild( time );
    title.appendChild( subtitle );

    return banner;
}

function jButton( innerHTML, handler ){
    let button = document.createElement("button");
    button.innerHTML = innerHTML;
    button.onclick = handler;
    return button;
}
function updateArticle( article, conditional ){

    let target = updateAttribute( article.getElementsByTagName("section"), "dataset.visible", conditional );
    updateAttribute( article.getElementsByTagName("button"), "dataset.selected", conditional );
    updateAttribute( article.getElementsByTagName("button"), "dataset.selected", conditional );

    let subtitle = article.getElementsByClassName("subtitle")[0];
    let time = article.getElementsByClassName("timestamp")[0];

    if ( target[0].dataset.timestamp ){
        time.dataset.visible = true;
        time.innerHTML = target[0].dataset.timestamp;

        
    }
    else {
        time.dataset.visible = false;
    }


}

function updateAttribute( set, attributes, conditional ){

    let active = [];

    for ( let i = 0; i < set.length; ++i ){

        let selected = conditional( i );

        set[ i ][ attributes ] = selected;

        if ( selected ){
            active.push( set[i] )
        }

    }
    return active;
}

function timeStamp( json ){

    return json.launch_date_utc ||
        json.event_date_utc ||
        json.date ||
        json.year_built;
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
    if( imageArray && imageArray.length > 0 ){

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


// function updateTime( timeStamp ){

//     var date = new Date( timeDifference(timeStamp) );

//     var output = "";
//     var cascade = false;

//     var formats = { 
//         years: date.getUTCFullYear() - 1970,
//         months: date.getUTCMonth(),
//         days: date.getUTCDate(),
//         hours: date.getUTCHours(),
//         minutes: date.getUTCMinutes()
//     }

//     for( var key in formats ){
//         if ( formats[ key ] > 0 || cascade ){
//             cascade = true;
//             output += formats[ key ] + " " + key + ", ";
//         }
//     }
//     output += date.getUTCSeconds() + " seconds left";
//     return output;
// }

// function timeDifference( from, to = Date.now() ){
//     return new Date( from ) - new Date(to);
// }

// function initializeTime( json, timeStamp ){
//     var date = new Date( timeStamp );

//     /* Spaghetti date extracter :^) */
//     var relevantTime = String( date.getDate() ).padStart(2,0) 
//         + "/" + String( date.getMonth() ).padStart(2,0) 
//         + "/" + date.getFullYear();


//     return (
//         json.content.launch_date_utc ? "Launched: " + relevantTime : undefined ) ||
//         (json.content.year_built ? "Built in " + date.getFullYear() : undefined) ||
//         "Date: " + relevantTime;
// }

// function timeUpdater( json, timeStamp, timeObject ){

//     /* If time is in the future update time regularly */
//     if( json.content.is_tentative || timeDifference( timeStamp ) > 0 ){

//         /* update on initialization */
//         timeObject.innerHTML = updateTime( timeStamp, "launch" );

//         /* Define an updater to be called every second */
//         var updater = setInterval( function(){

//             /* update time */
//             timeObject.innerHTML =  updateTime(timeStamp, "launch" );

//             /* If the time is in the past, set time to timeStamp and cancel updater */
//             if ( timeDifference( timeStamp ) <= 0 ){

//                 clearInterval( updater );
//                 timeObject.innerHTML = timeStamp;
//             }
//         }, 200 );
//     }
//     /* Time is in the past, initialize timeObject to timeStamp */
//     else {
//         timeObject.innerHTML = initializeTime( json, timeStamp );
//     }

// }