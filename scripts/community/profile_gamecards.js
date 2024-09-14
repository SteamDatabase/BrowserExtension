'use strict';

MoveMultiBuyButton();

GetOption( { 'button-gamecards': true }, ( items ) =>
{
	if( !items[ 'button-gamecards' ] )
	{
		return;
	}

	const profileTexture = document.querySelector( '.profile_small_header_texture' );

	if( !profileTexture )
	{
		return;
	}

	// Container
	const container = document.createElement( 'div' );
	container.className = 'profile_small_header_additional steamdb';

	// Store button
	let span = document.createElement( 'span' );
	span.appendChild( document.createTextNode( _t( 'store_page' ) ) );

	let link = document.createElement( 'a' );
	link.className = 'btnv6_blue_hoverfade btn_medium';
	link.href = 'https://store.steampowered.com/app/' + GetCurrentAppID() + '/';
	link.appendChild( span );

	container.insertBefore( link, container.firstChild );

	// SteamDB button
	const image = document.createElement( 'img' );
	image.className = 'ico16';
	image.src = GetLocalResource( 'icons/white.svg' );

	span = document.createElement( 'span' );
	span.dataset.tooltipText = _t( 'view_on_steamdb' );
	span.appendChild( image );

	link = document.createElement( 'a' );
	link.className = 'btnv6_blue_hoverfade btn_medium btn_steamdb';
	link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/communityitems/';
	link.appendChild( span );

	container.insertBefore( link, container.firstChild );
	container.insertBefore( document.createTextNode( ' ' ), link.nextSibling );

	// Add to the page
	profileTexture.appendChild( container );
} );

function MoveMultiBuyButton()
{
	for( const element of document.querySelectorAll( '.gamecards_inventorylink a' ) )
	{
		const link = new URL( element.href );

		// Fix Valve incorrectly using CDN in the link
		if( link.host.endsWith( '.steamstatic.com' ) )
		{
			link.host = window.location.host;
			element.href = link.toString();
		}

		if( link.pathname === '/market/multibuy' )
		{
			// Add return to link to automatically return to the badge page after multi buying the cards
			const params = new URLSearchParams( link.search );
			params.set( 'steamdb_return_to', window.location.href );

			link.search = params.toString();
			element.href = link.toString();

			// Move the buy button up top
			const topLinks = document.querySelector( '.badge_detail_tasks .gamecards_inventorylink' );

			if( topLinks )
			{
				topLinks.append( element );
				topLinks.append( document.createTextNode( ' ' ) );

				// Some languages will overflow the buttons so we have to correct the spacing
				topLinks.classList.add( 'steamdb_gamecards_inventorylink' );
			}
		}
	}
}
