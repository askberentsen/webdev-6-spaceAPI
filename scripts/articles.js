'use strict';
class DOMGenerator {
    /* Constructor of the DOMGenerator. splits open the json and sets its own values to its contents */
    constructor( json ){
        this.content = json.content;
        this.info = json.info;
        this.nodes = {};

        /* regSearch is a heavy operation, this is done in constructor to minimize payload */
        /* Find all values in this.content that matches the regex */
        this.links     = regSearch( this.content, /(?:http|www\.).+/, "values", /\.(?:png|jpg|jpeg|gif)/ );
        this.technical = regSearch( this.content, /earth_distance_km|orbit_type|speed_kph|norad_id|launch_site|rocket_name|landing_vehicle|manufacturer|nationality|payload_type|payload_mass_kg|launch_success/ );
    }
    /* Main method */
    create(){
        this.create_nodes  ();
        this.append_nodes  ();
        this.populate_nodes();
        return this.nodes.article;
    }

    /* Get methods for decoupled information requisition */
    get title   () { return this.info.title   }
    get types   () { return this.info.types   }
    get id      () { return this.info.id      }
    get updated () { return this.info.updated }
    get time    () { 
        return new DateFormat( 
            this.content.time || 
            this.content.date ||
            this.content.launch_date_utc || 
            this.content.event_date_utc ||
            this.content.launch_year
        );
    }
    get description() { 
        return this.content.description || this.content.explanation || this.content.details;
    }
    get subtitle() {
        return this.content.title || this.content.name || this.content.mission_name;
    }
    get caption() {
        let count = (this.images.length === 1 ? "Image" : "Images") 
        let rocket_name = deepGetProperty( this.content, "rocket_name").value;
        if ( rocket_name ) return count + " of the " + rocket_name + " rocket.";

        return count + " courtesy of " + ( this.content.copyright || this.info.domain );
    }
    get images() {

        let imgs = deepGetProperty( this.content, "flickr_images").value;
        let img = (this.content.media_type === "image" ? this.content.url : undefined );
        return imgs ? imgs : [ img ];
    }
    get video() {
        let output =  deepGetProperty( this.content, "video_link").value;
        if ( output ){
            return output;
        }
        return ( this.content.media_type === "video" ? this.content.url : undefined );
    }

    /* Node generation methods for node generation */

    /* Create_nodes will instantiate all the relevant nodes */
    create_nodes(){
        
        this.nodes.article       = document.createElement( "article" );
        this.nodes.banner        = document.createElement( "header"  );
        this.nodes.title         = document.createElement( "h2"      );
        this.nodes.time          = document.createElement( "time"    );
        this.nodes.footer        = document.createElement( "footer"  );
        this.nodes.cite          = document.createElement( "address" );
        this.nodes.technical     = this.create_technical (           );
        this.nodes.links         = this.create_links     (           );
        if ( this.nodes.links || this.nodes.technical ){
            this.nodes.aside         = document.createElement( "aside"   );
            this.nodes.aside_header = document.createElement( "h3"      );
        }
        this.nodes.navigation    = this.types.length > 1 ? document.createElement( "nav"     ) : null;
        this.nodes.sections      = [];

        /* Sections are variant, and needs to be specialized further */
        for ( let type of this.types ){
            switch( type ){
                case "table": 
                    this.nodes.sections.push( this.create_table_section   () );
                    break;
                case "gallery": 
                    this.nodes.sections.push( this.create_gallery_section () );
                    break;
                case "stats": 
                    this.nodes.sections.push( this.create_stats_section   () );
                    break;
                case "normal":
                default: 
                    this.nodes.sections.push( this.create_default_section () );
                    break;
            }
        }
    }

    /* Append_nodes will append all the instantiated nodes */
    append_nodes(){
        this.nodes.article.appendChild( this.nodes.banner );
        if ( this.nodes.navigation ){
            this.nodes.article.appendChild( this.nodes.navigation );
        }
        this.nodes.sections.forEach( section => { this.nodes.article.appendChild( section ) } );
        if ( this.nodes.aside ){
            this.nodes.article.appendChild ( this.nodes.aside         );
            this.nodes.aside .appendChild ( this.nodes.aside_header );
        }
        if ( this.nodes.links     ){
            this.nodes.aside .appendChild( this.nodes.links );
        }
        if ( this.nodes.technical ){
            this.nodes.aside .appendChild( this.nodes.technical      );
        }
        this.nodes.article.appendChild ( this.nodes.footer        );
        this.nodes.footer .appendChild ( this.nodes.cite          );
        
        this.nodes.banner.appendChild( this.nodes.title   );
        this.nodes.banner.appendChild( this.nodes.time    );
    }
    
    /* Populate_nodes will populate the nodes with content and data */
    populate_nodes() {
        this.nodes.title.innerHTML         = this.title;
        this.nodes.banner.classList        .add( "article_banner"           );
        this.nodes.title.classList         .add( "article_title"            );
        this.nodes.time.classList          .add( "article_timestamp"        );
        this.nodes.time.dateTime           = this.time.toISOString         ();
        this.nodes.time.innerHTML          = this.time.to("dd/MM/yyyy"      );
        this.nodes.time.id                 = this.id + "_time"               ;
        this.nodes.title.id                = this.id + "_title"              ;
        this.nodes.article.id              = this.id + "_article"            ;
        this.nodes.banner.id               = this.id + "_banner"             ;
        this.nodes.footer.id               = this.id + "_footer"             ;
        this.nodes.cite.innerHTML          = "API used: " + this.info.domain ;
        if ( this.nodes.aside ){
            this.nodes.aside.id                = this.id + "_aside"          ;
            this.nodes.aside_header.innerHTML  = "Technical details"         ;
        }
        
    }

    /* Type specific node creation */
    create_table_section   (){}
    create_gallery_section (){}
    create_stats_section   (){}
    create_default_section (){

        /* Declare all nodes */
        let section, subtitle, copyright, media, text;

        /* Initialize all nodes */
        section   = document.createElement( "section" );
        subtitle  = document.createElement( "h3"      );
        copyright = this.content.copyright ? document.createElement( "address" ) : null;
        media     = this    .create_media (           );
        text      = document.createElement( "p"       );

        /* Append all nodes */
        section.appendChild( subtitle );
        if ( copyright ) { section.appendChild( copyright ) }
        if ( media     ) { section.appendChild( media     ) }
        section.appendChild( text     );
        
        /* Populate all nodes */
        if( copyright ) { copyright.innerHTML = this.content.copyright + " " + this.time.getFullYear() + "&copy; " }
        subtitle .innerHTML = this.subtitle;
        text     .innerHTML = this.description;

        return section;
    }
    create_media(){
        if( this.video ){
            let wrapper = document.createElement("div");
            let embed = document.createElement("iframe");
            embed.title = strip_url( this.video, false );
            
            let url = this.video.match("embed") ? this.video : this.video.replace("watch?v=","embed/");
            url += "?rel=0&color=white&mute=1&modestbranding=1";

            wrapper.appendChild( embed );

            embed  .src = url;
            embed  .allowFullscreen = true;
            embed  .classList.add( "youtube_video"       );
            wrapper.classList.add( "youtube_wrapper"     );
            wrapper.setAttribute ("role", "presentation" );
            embed  .setAttribute ("role", "application"  );
            return wrapper;
        }
        else if ( this.images ){
            let figure = document.createElement( "figure"      );
            let caption = document.createElement( "figcaption" );
            
            for ( let url of this.images ){
                let image = document.createElement( "img" );
                image.src = url;
                image.alt = "";
                figure.appendChild( image );
            }
            if ( this.images.length > 1 ){
                figure.classList.add( "image_gallery" );
            }
            figure.appendChild( caption );
            caption.innerHTML = this.caption;

            return figure;
        }
        return undefined;
    }
    create_technical(){
        if ( this.technical.length > 0 ){
            let details = this.create_details   ( "Statistics:" );
            let wrapper = document.createElement( "div"         );
            details.appendChild  ( wrapper              );
            wrapper.setAttribute ("role","presentation" );
            wrapper.classList.add("details_wrapper"     );

            for( let entry of this.technical ){
                let stat;
                let value = entry.value;
                if ( entry.value instanceof Object ){
                    switch( entry.property ){
                        case "launch_site":
                            stat       = document.createElement ( "abbr" );
                            value      = entry.value.site_name;  
                            stat.title = entry.value.site_name_long;  
                            break;  
                        default:  
                            stat = document.createElement( "span" );  
                    }  
                }  
                else {  
                    stat = document.createElement ( "span" );
                }  

                let stat_name  = document.createElement ( "span"         );
                let label = entry.property.replace      ( /\_/g, " "     );
                wrapper        .appendChild             ( stat_name      );
                wrapper        .appendChild             ( stat           );
                
                stat_name.classList.add                  ( "detail_label" );
                stat.classList.add                       ( "detail_value" );
                stat_name.innerHTML = label;
                stat.innerHTML      = value;
                stat     .setAttribute ( "aria-label", label   );
                stat_name.setAttribute ( "aria-hidden", "true" );
                
            }
            return details;
        }
    }
    create_links(){
        if ( this.links.length > 0 ){
            let details = this.create_details( "Links:" );
            let wrapper = document.createElement("div");
            details.appendChild(wrapper);
            wrapper.setAttribute("role","presentation");
            wrapper.classList.add("details_wrapper");

            for ( let i = 0; i < this.links.length; ++i ){

                let label             = this.links.properties[ i ].replace( /\_/g," "          );
                let stripped_link     = strip_url              ( this.links.values[ i ], true  );
                let link_name         = document.createElement ( "span"                        );
                let link_url          = document.createElement ( "a"                           );
                wrapper               .appendChild             ( link_name                     );
                wrapper               .appendChild             ( link_url                      );
                link_url.title        = strip_url              ( this.links.values[ i ], false );
                link_url.innerHTML    = stripped_link                                           ;
                link_url.href         = this.links.values[ i ]                                  ;
                link_url              .setAttribute            ( "aria-label", label           );
                link_url              .classList.add           ( "detail_value"                );
                link_name             .setAttribute            ( "aria-hidden", "true"         );
                link_name             .classList.add           ( "detail_label"                );
                link_name.innerHTML   = label;
            }
            return details;
        }
    }
    create_details( name ){
        let details = document.createElement( "details" );
        let summary = document.createElement( "summary" );
        details.appendChild( summary );
        summary.innerHTML = name;
        return details;
    }
}

function strip_url( url, extension = true ){
    let output = url.replace( /https?:\/\/w*\.?/,""  );
    if ( !extension ){
        output = output.match( /[A-Za-z0-9.-]+(?!.*\|\w*$)/ );
    }
    return output;
}