/* Find the first instance of a property in an object */
function deepGetProperty( arg, propertyname, breadcrumbs = new StatArray() ){

    /*  Check if property was found, if it was found, 
        return key, value and breadcrumbs*/
    if ( arg !== null && ( getNested(arg, propertyname) !== undefined)){

        breadcrumbs.push( propertyname );
        return { 
            property: propertyname, 
            value   : arg[ propertyname ],
            breadcrumbs: breadcrumbs
        }
    }
    /* Property was not found on this level, search deeper */
    else if ( arg instanceof Object ){
        
        for ( let key in arg ){

            /* Make new breadcrumbs*/
            let newBreadcrumbs = breadcrumbs.slice();
            newBreadcrumbs.push( key );

            /* Recursively get property */
            let output = deepGetProperty( arg[ key ], propertyname, newBreadcrumbs );

            /* If something was found, return output*/
            if ( !output.deadend ){
                return output;
            }
        }

    }
    /* Nothing was found on this level or deeper */
    return {
        property   : undefined,
        value      : undefined,
        breadcrumbs: undefined,
        deadend    : true
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

/* Searches through a deeply nested structure, matching properties/values with a regex
 * A search can be unmatched if an exclude pattern is defined
 * The function will return a StatArray of all the matched entries, where each entry
 * is an object with properties: .property, .value and .breadcrumbs.
 * .breadcrumbs returns an array of the path to the match
 */
function regSearch( json, pattern, type = "property", exclude_pattern = undefined, breadcrumbs = [] ){

    /* Declare an ampty StatArray, so that different properties can be accessed with the StatArray methods */
    let output = new StatArray();

    /* Iterate through the current layer in the json */
    for ( let key in json ){

        /* Check if the current target is a non primitive datatype, e.g array or object, but not null */
        if ( json[ key ] && json[ key ] instanceof Object ){
            
            /* Define a new breadcrumb and append the current key to it */
            let new_crumbs = breadcrumbs.slice();
            new_crumbs.push( key );

            /* Recursively search deeper in the current element, and include the new breadcrumb */
            let subout = regSearch( json[ key ], pattern, type, exclude_pattern, new_crumbs );

            /* If matches were found, append them*/
            /* Since if no matches were found, subout will be an empty array, spreading it won't 
             * change the output StatArray. */
            output.push( ...subout );
        }
        
        let haystack = type === "property" ? key : String(json[ key ]);

        /* Match with pattern and unmatch with exclude_pattern if defined */
        let match = haystack.match( pattern );
        let unmatch = exclude_pattern !== undefined ? haystack.match( exclude_pattern ) : false;

        /* Check if the item is matched */
        if ( match && !unmatch ){
            /* return the item */
            let new_crumbs = breadcrumbs.slice( key );
            new_crumbs.push( key );
            output.push( { property: key, value: json[ key ], breadcrumbs: new_crumbs } );
        }
        
    }
    return output;
}
class StatArray extends Array{
    constructor   ( ...args  ) { super ( ...args ) }
    get values    (          ) { return this.get_property( "value"       ) }
    get properties(          ) { return this.get_property( "property"    ) }
    get_property  ( property ) {
        let output = [];
        for( let i = 0; i < this.length; ++i ){
            output.push( this[ i ][ property ] );
        }
        return output;
    }
    get associative() {
        let output = {};
        for( let i = 0; i < this.length; ++i ){
            output[ this[ i ].property ] = this[ i ].value;
        }
        return output;
    }
}