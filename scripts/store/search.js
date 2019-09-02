'use strict';

GetOption( { 'button-search': true }, function( items )
{
	if( !items[ 'button-search' ] )
	{
		return;
	}
	
	var container = document.querySelector( '#advsearchform .rightcol' );

	if( !container )
	{
        return;
    }

    var GetSteamDBLink = function()
    {
        var link = GetHomepage() + 'search/?';
        var params = decodeURIComponent( window.location.search );

        var HasParam = ( param ) => params.includes( param + '=' );
        var GetParam = ( param ) => HasParam( param ) && encodeURIComponent( params.split( param + '=' )[ 1 ].split( /&|#/ )[ 0 ].split( ',' )[ 0 ] );

        var types = { '10': 3, '21': 4, '992': 13, '993': 16, '994': 2, '997': 1, '998': 1, '999': 8 };
        var typeparam = HasParam( 'category1' ) && types[ GetParam( 'category1' ) ] ? '&type=' + types[ GetParam( 'category1' ) ] : '';

        switch( true )
        {
            case HasParam( 'filter' ) && GetParam( 'filter' ) === 'comingsoon':
                link = GetHomepage() + 'upcoming/';
                break;

            case HasParam( 'category2' ):
                link += 'a=app&q=' + encodeURIComponent( GetParam( 'term' ) || '' ) + '&category=' + GetParam( 'category2' ) + typeparam;
                break;

            case HasParam( 'category3' ):
                link += 'a=app&q=' + encodeURIComponent( GetParam( 'term' ) || '' ) + '&category=' + GetParam( 'category3' ) + typeparam;
                break;

            case HasParam( 'vrsupport' ):
                link += 'a=app&q=' + encodeURIComponent( GetParam( 'term' ) || '' ) + '&category=' + GetParam( 'vrsupport' ) + typeparam;
                break;

            case HasParam( 'term' ):
                link += 'a=app&q=' + encodeURIComponent( GetParam( 'term' ) || '' ) + '&category=0' + typeparam;
                break;

            case HasParam( 'os' ):
                link += 'a=app_keynames&keyname=92&operator=1&keyvalue=' + GetParam( 'os' ) + typeparam;
                break;

            case HasParam( 'developer' ):
                link += 'a=app_keynames&keyname=23&operator=3&keyvalue=' + GetParam( 'developer' ) + typeparam;
                break;

            case HasParam( 'pubisher' ):
                link += 'a=app_keynames&keyname=241&operator=3&keyvalue=' + GetParam( 'pubisher' ) + typeparam;
                break;

            case HasParam( 'supportedlang' ):
                link += 'a=app_keynames&keyname=444&operator=1&keyvalue=' + GetParam( 'supportedlang' ) + typeparam;
                break;

            default:
                link += 'a=app&q=&category=0' + typeparam;
                break;

        }

        return link + '&utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
    };

    var span = document.createElement( 'span' );
    span.appendChild( document.createTextNode( 'VIEW ON STEAM DATABASE' ) );
    
    var button = document.createElement( 'button' );
    button.className = 'btnv6_blue_hoverfade btn_small block';
    button.style.width = '100%';
    button.addEventListener( 'click', () => window.open( GetSteamDBLink(), '_blank' ) );
    button.appendChild( span );

    container.insertBefore( button, container.firstChild );
} );
