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
    document.body.dataset.loading = completion;
}
function finish( response ){
    document.getElementById("loading").outerHTML = "";
    delete document.body.dataset.loading;
    return response;
}

//////////////////////////////////////////////////////////////////
//                        Write articles                        //
//////////////////////////////////////////////////////////////////

function main( jsonArray ){

    var main = document.getElementsByTagName("MAIN")[0];

    for( let json of jsonArray ){

        let article = writeArticle ( json );
        main.appendChild( article );
        initializeArticle( article );

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
    subtitle.id = json.info.id + "_subtitle";

    /* Return node */
    return banner;
}

function createNavigation( json ){

    if ( json.info.sections ) {
        /* Define nav node */
        let navigation = document.createElement("nav");

        for( let section in json.info.sections ){

            /* Define menu item node */
            let menuItem = document.createElement("button");

            /* Append node */
            navigation.appendChild( menuItem );

            /* Populate node */
            menuItem.onclick                = function(){ switchSection( this )};
            menuItem.innerHTML              = section                           ;
            menuItem.dataset.selected       = false                             ;
            menuItem.dataset.targetId       = json.info.id + "_" + section      ;
            menuItem.dataset.targetName     = json.info.id                      ;
            menuItem.setAttribute ( "name",   json.info.id + "_button"    )     ;
        }

        return navigation;
    }
    return null;
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
                let table = createTable( relevantJson, json.info.id );

                section.appendChild( table );

                break;
            default:
                section.innerHTML = relevantJson.details || relevantJson.explanation;
                break;
        }


    }
    return nodeList;
}

function createTable ( json, type ){

    /* Get the metadata bout the json object */
    let metadata = getMetadata( type );

    /* Define nodes */
    let table = document.createElement("table");
    let header = createTablerow( metadata, "th" );

    /* Populate attributes */
    header.classList.add("table_header");

    /* Append header */
    table.appendChild( header );

    for ( let item of json ){
        
        /* Define nodes */
        let row = createTablerow( metadata, item );

        /* Append nodes */
        table.appendChild( row );

    }
    return table;
}
function createTablerow( metadata, arg ){

    let row = document.createElement("tr");

    for ( let item of metadata ){

        let cell;

        if ( arg === "th"){
            cell = document.createElement( "th" );
            cell.innerHTML = item.name;
        }
        else {
            cell = document.createElement( item.cellType );
            let textNode;
            let member = getNested( arg, item.key ) || "";
            let alt = getNested( arg, item.alt ) || item.alt;
    
            if ( item.type ){
                textNode = document.createElement( item.type );
                cell.appendChild( textNode );
            }
            else {
                textNode = cell;
            }
    
            if ( item.alt ){
                textNode.title = alt;
            }
    
            if ( item.modifier ){
                item.modifier( textNode, member );
            }
            else {
                textNode.innerHTML = member;
            }
        }

        cell.dataset.type = item.name;
        row.appendChild( cell );
    }
    return row;

}
function initializeArticle( article ){
    let button = article.getElementsByTagName("button");
    if ( button[0] ){
        switchSection( button[0] );
    }
}

function getNested( object, accessors ){

    /* Get nested members from object, using a string */
    /* If a member isn't found, return undefined */
    if ( accessors ){
        let path = [object, ...accessors.split(".") ];
        return get( path );
    }
}
function get( accessors ){

    /* Get nested members from an array of accessors */
    return accessors.reduce( ( path, accessor ) => ( path && path[ accessor ] ) ? path[ accessor ] : undefined );
}

function getMetadata( type ){

    const metadata = {
        "upcomming_launch":[
            { name: "Launches",      key: "mission_name",            cellType: "th", type: null,   alt: null,                         modifier: null        },
            { name: "Flight number", key: "flight_number",           cellType: "td", type: null,   alt: null,                         modifier: null        },
            { name: "Rocket",        key: "rocket.rocket_name",      cellType: "td", type: null,   alt: null,                         modifier: null        },
            { name: "Payload",       key: "rocket.second_stage.payloads.0.payload_type",    cellType: "td", type: null,   alt: null,  modifier: null        },
            { name: "Payload mass",  key: "rocket.second_stage.payloads.0.payload_mass_kg", cellType: "td", type: null,   alt: null,  modifier: null        },
            { name: "Launch site",   key: "launch_site.site_name",   cellType: "td", type: "abbr", alt: "launch_site.site_name_long", modifier: null        },
            { name: "Launch date",   key: "launch_date_utc",         cellType: "td", type: "time", alt: null,                         modifier: formatTime  },
            { name: "Links",         key: "links",                   cellType: "td", type: null,   alt: null,                         modifier: formatLinks }
        ],
        "history":[
            { name: "Article",       key: "title",                   cellType: "th", type: null,   alt: null,                         modifier: null        },
            { name: "Flight number", key: "flight_number",           cellType: "td", type: null,   alt: null,                         modifier: null        },
            { name: "Date",          key: "event_date_utc",          cellType: "td", type: "time", alt: null,                         modifier: formatTime  },
            { name: "Article",       key: "links",                   cellType: "td", type: null,   alt: null,                         modifier: formatLinks }
        ]
    }
    return metadata[ type ];
}

function formatTime( node, arg ){

    /* Define date */
    let date = new Date( arg );

    /* Populate node */
    node.dateTime = arg;
    node.innerHTML = date.getUTCDate() + "/" + date.getUTCMonth() + "/" + date.getUTCFullYear();
}
function formatLinks( node, linkList ){

    /* Iterate through link list and append defined links */
    for ( let href in linkList ){

        /* Control that link is defined, and isn't an array */
        if ( linkList[ href ] && !( linkList[ href ] instanceof Array ) ){

            /* Define node */
            let link = document.createElement("a");

            /* Populate node */
            link.href = linkList[ href ];
            link.title = linkList[ href ];
            link.innerHTML = href.replace( "_", " " );

            /* Append node */
            node.appendChild( link );
        }
    }
}


function createFooter( json ){

    /* Define node */
    let footer = document.createElement( "footer" );

    /* Populate attributes */

    /* Populate node */
    footer.innerHTML = "Hello World!";

    return footer;
}

function switchSection( caller ){

    /* Get sections of article */
    let selectedSection    = document.getElementById   ( caller.dataset.targetId   );
    let unselectedSections = document.getElementsByName( caller.dataset.targetName );
    let unselectedButtons  = document.getElementsByName( caller.name               );
    let subtitle           = document.getElementById   ( caller.dataset.targetName + "_subtitle" );

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
    caller.dataset.selected = true;
    subtitle.innerHTML = " - " + caller.innerHTML;
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