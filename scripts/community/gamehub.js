/* global CurrentAppID: true */
'use strict';

GetOption( {
	'button-gamehub': true,
	'button-pcgw': true,
}, function( items )
{
	let element;
	let link;
	let image;
	let container = document.querySelector( '.apphub_OtherSiteInfo' );

	if( container )
	{
		// Are we in a hacky game group with a custom url?
		if( GetCurrentAppID() === -1 )
		{
			element = document.querySelector( '.apphub_sectionTab' );

			CurrentAppID = element.href.match( /\/([0-9]+)\/?/ );
			CurrentAppID = CurrentAppID ? CurrentAppID[ 1 ] : -1;
		}

		if( GetCurrentAppID() < 1 )
		{
			return;
		}

		// Make in-game number clickable
		element = document.querySelector( '.apphub_NumInApp' );

		if( element )
		{
			link = document.createElement( 'a' );
			link.rel = 'noopener';
			link.className = 'apphub_NumInApp';
			link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/graphs/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
			link.title = 'View player graphs on SteamDB';
			link.textContent = element.textContent;

			element.parentNode.replaceChild( link, element );
		}

		if( items[ 'button-gamehub' ] )
		{
			link = document.createElement( 'a' );
			link.rel = 'noopener';
			link.className = 'btnv6_blue_hoverfade btn_medium btn_steamdb';
			link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';

			element = document.createElement( 'span' );
			element.dataset.tooltipText = 'View on SteamDB';
			link.appendChild( element );

			image = document.createElement( 'img' );
			image.className = 'ico16';
			image.src = GetLocalResource( 'icons/white.svg' );

			element.appendChild( image );

			container.insertBefore( link, container.firstChild );
		}

		if( items[ 'button-pcgw' ] )
		{
			container = document.querySelector( '.apphub_OtherSiteInfo' );

			if( container )
			{
				link = document.createElement( 'a' );
				link.rel = 'noopener';
				link.className = 'btnv6_blue_hoverfade btn_medium btn_steamdb';
				link.href = 'https://pcgamingwiki.com/api/appid.php?appid=' + GetCurrentAppID() + '&utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';

				element = document.createElement( 'span' );
				element.dataset.tooltipText = 'View article on PCGamingWiki';
				link.appendChild( element );

				image = document.createElement( 'img' );
				image.className = 'ico16';
				image.src = GetLocalResource( 'icons/pcgamingwiki.svg' );

				element.appendChild( image );

				container.insertBefore( link, container.firstChild );

				container.insertBefore( document.createTextNode( ' ' ), link.nextSibling );
			}
		}
	}
} );
