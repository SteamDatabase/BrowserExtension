'use strict';

GetOption( { 'profile-calculator': true }, function( items )
{
	if( !items[ 'profile-calculator' ] )
	{
		return;
	}

	// Can't access g_rgProfileData inside sandbox :(

	// If we can, use abuseID
	let steamID = document.querySelector( '#abuseForm > input[name=abuseID]' );
	let isCommunityID = false;

	if( steamID )
	{
		steamID = steamID.value;

		isCommunityID = true;
	}
	else
	{
		// Fallback to url if we can't
		steamID = location.pathname.match( /^\/(?:id|profiles)\/([^\s/]+)\/?/ )[ 1 ];

		isCommunityID = /^\/profiles/.test( location.pathname );
	}

	let container = document.querySelector( '#profile_action_dropdown .popup_body' );
	let url = GetHomepage() + 'calculator/';

	if( isCommunityID )
	{
		url += steamID + '/?';
	}
	else
	{
		url += '?player=' + steamID + '&';
	}

	url += 'utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';

	let image, element;

	if( container )
	{
		image = document.createElement( 'img' );
		image.className = 'steamdb_popup_icon';
		image.src = GetLocalResource( 'icons/white.svg' );

		element = document.createElement( 'a' );
		element.rel = 'noopener';
		element.href = url;
		element.className = 'popup_menu_item';
		element.appendChild( image );
		element.appendChild( document.createTextNode( '\u00a0 SteamDB Calculator' ) );

		container.insertBefore( element, null );
	}
	else
	{
		container = document.querySelector( '.profile_header_actions' );

		if( container )
		{
			const text = document.createElement( 'span' );

			image = document.createElement( 'img' );
			image.src = GetLocalResource( 'icons/white.svg' );
			image.className = 'steamdb_self_profile';

			text.appendChild( image );

			element = document.createElement( 'a' );
			element.rel = 'noopener';
			element.className = 'btn_profile_action btn_medium';
			element.href = url;
			element.title = 'SteamDB Calculator';
			element.appendChild( text );

			container.appendChild( element );
		}
	}
} );
