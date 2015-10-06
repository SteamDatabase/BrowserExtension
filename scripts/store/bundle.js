'use strict';

GetOption( { 'link-bundle-packages': true }, function( items )
{
	if( !items[ 'link-bundle-packages' ] )
	{
		return;
	}
	
	var container = document.querySelector( '.game_area_purchase_game.bundle' );
	
	if( container )
	{
		var elements = document.querySelectorAll( '[data-ds-packageid]' );

		if( elements.length === 0 )
		{
			return;
		}

		var i, subs = [ ];

		for( i = 0; i < elements.length; i++ )
		{
			if ( subs.indexOf( elements[ i ] ) == -1 )
			{
				subs.push( elements[ i ].dataset.dsPackageid );
			}
		}

		subs.sort( function( a, b )
		{
			return a - b;
		} );

		var element = document.createElement( 'div' );
		element.appendChild( document.createTextNode( 'View on Steam Database ' ) );

		var subidElement = document.createElement( 'i' );
		subidElement.className = 'steamdb_subid';

		subidElement.appendChild( document.createTextNode( '(' ) );

		for( i = 0; i < subs.length; i++ )
		{
			var link = document.createElement( 'a' );
			link.className = 'steamdb_link';
			link.target = '_blank';
			link.href = GetHomepage() + 'sub/' + subs[ i ] + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
			link.appendChild( document.createTextNode( subs[ i ] ) );
			subidElement.appendChild( link );

			if( i < subs.length - 1 )
			{
				subidElement.appendChild( document.createTextNode( ', ' ) );
			}
		}

		subidElement.appendChild( document.createTextNode( ')' ) );

		element.appendChild( subidElement );
		
		container.appendChild( element, container.firstChild );
	}
} );
