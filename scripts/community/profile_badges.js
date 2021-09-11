'use strict';

const progressInfo = document.querySelectorAll( '.progress_info_bold' );

if( progressInfo.length > 0 )
{
	let apps = 0;
	let drops = 0;
	let match;

	for( let i = 0; i < progressInfo.length; i++ )
	{
		match = progressInfo[ i ].textContent.match( /([0-9]+) card drops? remaining/ );

		if( match )
		{
			match = parseInt( match[ 1 ], 10 ) || 0;

			if( match > 0 )
			{
				apps++;
				drops += match;
			}
		}
	}

	if( apps > 0 )
	{
		const text = document.createElement( 'span' );
		text.className = 'steamdb_drops_remaining';
		text.appendChild( document.createTextNode( drops + ' drops remaining across ' + apps + ' apps' + ( document.querySelector( '.pageLinks' ) ? ' on this page' : '' ) ) );

		const container = document.querySelector( '.badge_details_set_favorite' );

		if( container )
		{
			container.insertBefore( text, container.firstChild );
		}
	}
}
else
{
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

		const badgeUrl = location.pathname.match( /\/badges\/([0-9]+)/ );

		if( !badgeUrl )
		{
			return;
		}

		const badgeid = parseInt( badgeUrl[ 1 ], 10 );

		const container = document.createElement( 'div' );
		container.className = 'profile_small_header_additional steamdb';

		const image = document.createElement( 'img' );
		image.className = 'ico16';
		image.src = GetLocalResource( 'icons/white.svg' );

		const span = document.createElement( 'span' );
		span.dataset.tooltipText = 'View badge on SteamDB';
		span.appendChild( image );

		const link = document.createElement( 'a' );
		link.rel = 'noopener';
		link.className = 'btnv6_blue_hoverfade btn_medium btn_steamdb';
		link.href = GetHomepage() + 'badge/' + badgeid + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
		link.appendChild( span );

		container.insertBefore( link, container.firstChild );

		profileTexture.appendChild( container );
	} );
}
