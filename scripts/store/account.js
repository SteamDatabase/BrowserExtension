'use strict';

GetOption( { 'link-accountpage': true }, function( items )
{
	if( !items[ 'link-accountpage' ] )
	{
		return;
	}

	// TODO: Look for RemoveFreePackage subids

	const licenses = document.querySelectorAll( '.account_table tr > td:nth-child(2)' );
	let link;
	let subid;
	let element;
	let removeElement;

	if( licenses )
	{
		for( let i = 0, length = licenses.length; i < length; i++ )
		{
			element = licenses[ i ];

			link = document.createElement( 'a' );
			link.rel = 'noopener';

			removeElement = element.querySelector( '.free_license_remove_link a' );

			if( removeElement )
			{
				subid = removeElement.href.match( /RemoveFreeLicense\( ?([0-9]+)/ );

				if( !subid )
				{
					continue;
				}

				link.href = GetHomepage() + 'sub/' + subid[ 1 ] + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
				link.appendChild( document.createTextNode( ' [' + subid[ 1 ] + ']' ) );

				removeElement.parentNode.appendChild( link );
			}
			else
			{
				link.className = 'free_license_remove_link';
				link.href = GetHomepage() + 'search/?a=sub&q=' + encodeURIComponent( element.textContent.trim() ) + '&utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
				link.appendChild( document.createTextNode( '[SteamDB]' ) );

				element.appendChild( link );
			}
		}
	}
} );
