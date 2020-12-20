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
			element.dataset.tooltipText = 'View on Steam Database';
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
	else if( items[ 'button-gamehub' ] )
	{
		container = document.getElementById( 'rightActionBlock' );

		// Are we in an official game group?
		if( container )
		{
			// Are we in a hacky game group with a custom url?
			if( GetCurrentAppID() === -1 )
			{
				// Try to find game hub link, what possibly could go wrong?
				element = document.querySelector( 'a[href*="http://steamcommunity.com/app/"], a[href*="https://steamcommunity.com/app/"]' );

				// Let's just hope this doesn't break
				CurrentAppID = element.href.match( /\/([0-9]+)\/?/ )[ 1 ];
			}

			// image
			image = document.createElement( 'img' );
			image.className = 'steamdb_ogg_icon';
			image.src = GetLocalResource( 'icons/white.svg' );

			// image container
			const actionItemIcon = document.createElement( 'div' );
			actionItemIcon.className = 'actionItemIcon';
			actionItemIcon.appendChild( image );

			// link
			link = document.createElement( 'a' );
			link.rel = 'noopener';
			link.className = 'linkActionMinor';
			link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
			link.appendChild( document.createTextNode( 'View on Steam Database' ) );

			element = document.createElement( 'div' );
			element.className = 'actionItem';
			element.appendChild( actionItemIcon );
			element.appendChild( link );

			container.insertBefore( element, null );
		}
	}
} );
