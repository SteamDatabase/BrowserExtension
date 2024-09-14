/* global CurrentAppID: true */
'use strict';

GetOption( {
	'button-gamehub': true,
	'button-pcgw': true,
}, ( items ) =>
{
	let element;
	let link;
	let image;
	const container = document.querySelector( '.apphub_OtherSiteInfo' );

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
			link.className = 'apphub_NumInApp';
			link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/charts/';
			link.title = _t( 'view_on_steamdb' );
			link.textContent = element.textContent;

			element.parentNode.replaceChild( link, element );
		}

		if( items[ 'button-gamehub' ] )
		{
			link = document.createElement( 'a' );
			link.className = 'btnv6_blue_hoverfade btn_medium btn_steamdb';
			link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/';

			element = document.createElement( 'span' );
			element.dataset.tooltipText = _t( 'view_on_steamdb' );
			link.appendChild( element );

			image = document.createElement( 'img' );
			image.className = 'ico16';
			image.src = GetLocalResource( 'icons/white.svg' );

			element.appendChild( image );

			container.insertBefore( link, container.firstChild );

			const responsiveMenu = document.querySelector( '.apphub_ResponsiveMenuCtn' );

			if( responsiveMenu )
			{
				responsiveMenu.append( link.cloneNode( true ) );
			}
		}

		if( items[ 'button-pcgw' ] )
		{
			link = document.createElement( 'a' );
			link.className = 'btnv6_blue_hoverfade btn_medium btn_steamdb';
			link.href = 'https://pcgamingwiki.com/api/appid.php?appid=' + GetCurrentAppID() + '&utm_source=SteamDB';

			element = document.createElement( 'span' );
			element.dataset.tooltipText = _t( 'view_on_pcgamingwiki' );
			link.appendChild( element );

			image = document.createElement( 'img' );
			image.className = 'ico16';
			image.src = GetLocalResource( 'icons/pcgamingwiki.svg' );

			element.appendChild( image );

			container.insertBefore( link, container.firstChild );

			container.insertBefore( document.createTextNode( ' ' ), link.nextSibling );

			const responsiveMenu = document.querySelector( '.apphub_ResponsiveMenuCtn' );

			if( responsiveMenu )
			{
				responsiveMenu.append( document.createTextNode( ' ' ) );
				responsiveMenu.append( link.cloneNode( true ) );
			}
		}
	}
} );
