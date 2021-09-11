'use strict';

GetOption( { 'button-gamecards': true }, function( items )
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
	span.appendChild( document.createTextNode( 'Store Page' ) );

	let link = document.createElement( 'a' );
	link.rel = 'noopener';
	link.className = 'btnv6_blue_hoverfade btn_medium';
	link.href = 'https://store.steampowered.com/app/' + GetCurrentAppID() + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
	link.appendChild( span );

	container.insertBefore( link, container.firstChild );

	// SteamDB button
	const image = document.createElement( 'img' );
	image.className = 'ico16';
	image.src = GetLocalResource( 'icons/white.svg' );

	span = document.createElement( 'span' );
	span.dataset.tooltipText = 'View on SteamDB';
	span.appendChild( image );

	link = document.createElement( 'a' );
	link.rel = 'noopener';
	link.className = 'btnv6_blue_hoverfade btn_medium btn_steamdb';
	link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/communityitems/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
	link.appendChild( span );

	container.insertBefore( link, container.firstChild );

	// Best hacks EU
	container.insertBefore( document.createTextNode( ' ' ), link.nextSibling );

	// Add to the page
	profileTexture.appendChild( container );
} );
