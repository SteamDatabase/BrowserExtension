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
