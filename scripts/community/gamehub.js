GetOption( [ 'button-gamehub' ], function( items )
{
	if( items[ 'button-gamehub' ] === true )
	{
		return;
	}
	
	var element, container = document.querySelector( '.apphub_OtherSiteInfo' );
	
	if( container )
	{
		// Are we in a hacky game group with a custom url?
		if( GetCurrentAppID() === -1 )
		{
			element = document.querySelector( '.apphub_sectionTab' );
			
			CurrentAppID = element.href.match( /\/([0-9]{1,6})\/?/ );
			CurrentAppID = CurrentAppID ? CurrentAppID[ 1 ] : -1;
		}
		
		if( GetCurrentAppID() > -1 )
		{
			var text = document.createElement( 'span' );
			text.appendChild( document.createTextNode( 'Steam Database' ) );
			
			element = document.createElement( 'a' );
			element.className = 'btn_darkblue_white_innerfade btn_medium';
			element.target = '_blank';
			element.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/';
			element.appendChild( text );
			
			container.insertBefore( element, container.firstChild );
		}
	}
	else
	{
		container = document.getElementById( 'rightActionBlock' );
		
		// Are we in an official game group?
		if( container )
		{
			// Are we in a hacky game group with a custom url?
			if( GetCurrentAppID() === -1 )
			{
				// Try to find game hub link, what possibly could go wrong?
				element = document.querySelector( 'a[href*="http://steamcommunity.com/app/"]' );
				
				// Let's just hope this doesn't break
				CurrentAppID = element.href.match( /\/([0-9]{1,6})\/?/ )[ 1 ];
			}
			
			// image
			var image = document.createElement( 'img' );
			image.className = 'steamdb_ogg_icon';
			image.src = GetLocalResource( 'icons/18.png' );
			
			// image container
			var actionItemIcon = document.createElement( 'div' );
			actionItemIcon.className = 'actionItemIcon';
			actionItemIcon.appendChild( image );
			
			// link
			var link = document.createElement( 'a' );
			link.className = 'linkActionMinor';
			link.target = '_blank';
			link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/';
			link.appendChild( document.createTextNode( 'View on Steam Database' ) );
			
			element = document.createElement( 'div' );
			element.className = 'actionItem';
			element.appendChild( actionItemIcon );
			element.appendChild( link );
			
			container.insertBefore( element, null );
		}
	}
} );
