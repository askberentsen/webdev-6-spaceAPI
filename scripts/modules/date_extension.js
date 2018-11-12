'use strict';
class DateFormat extends Date {
    constructor( ...args ){
        super( ...args );
    }
    to( string ){
        /* Split string into patterns */
        var patterns = string.split(/\W+/);

        /* Find all delimiters */
        var delimiters = string.match(/\W+/g);

        /* Declare all empty variables */
        var output = [];
        var text = "";

        /* Iterate through patterns */
        for( var i = 0; i < patterns.length; ++i ){
            var format = patterns[ i ];
            switch ( format ){
                case "year":
                case "Year":
                case "yyyy":
                case "YYYY":
                    output.push( this.getUTCFullYear() );
                    break;
                case "mm":
                case "MM":
                    var mnt = this.getUTCMonth() + 1;
                    output.push( mnt > 9 ? mnt : "0" + mnt );
                    break;
                case "Month":
                case "month":
                    output.push( this.monthNames[ this.getUTCMonth() ] );
                    break;
                case "dd":
                case "DD":
                    output.push( this.getUTCDate() > 9 ? this.getUTCDate() : "0" + this.getUTCDate() );
                    break;
                default:
                    break;

            }
        }
        /* Insert delimiters back into output as a string */
        if( delimiters ){
            for( var i = 0; i < delimiters.length; ++i ){
                text += output[ i ] + delimiters[ i ];
            }

        }
        /* Return output as string */
        return text += output[ output.length - 1 ];
    }
    static get monthNames(){ 
        return [ "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december" ];
    }
}
