GetOption( [ 'profile-calculator' ], function( items )
{
	if( items[ 'profile-calculator' ] === true )
	{
		return;
	}
	
	// Can't access g_rgProfileData inside sandbox :(
	
	// If we can, use abuseID
	var steamID = document.querySelector( '#abuseForm > input[name=abuseID]' );
	
	if( steamID )
	{
		steamID = steamID.value;
	}
	else
	{
		// Fallback to url if we can't
		var steamID = location.pathname.match( /^\/(?:id|profiles)\/([^\s/]+)\/?/ )[ 1 ];
	}
	
	var container = document.querySelector( '#profile_action_dropdown .popup_body' );
	
	if( container )
	{
		var image = document.createElement( 'img' );
		image.src = GetLocalResource( 'icons/18.png' );
		
		var element = document.createElement( 'a' );
		element.href = GetHomepage() + 'calculator/?player=' + steamID;
		element.target = '_blank';
		element.className = 'popup_menu_item';
		element.appendChild( image );
		element.appendChild( document.createTextNode( ' SteamDB Calculator' ) );
		
		container.insertBefore( element, null );
	}
	else
	{
		container = document.querySelector( '.profile_header_actions' );
		
		if( container )
		{
			var text = document.createElement( 'span' );
			
			var image = document.createElement( 'img' );
			image.src = GetLocalResource( 'icons/18.png' );
			image.className = 'steamdb_self_profile';
			
			text.appendChild( image );
			
			element = document.createElement( 'a' );
			element.className = 'btn_profile_action btn_medium steamdb_button';
			element.target = '_blank';
			element.href = GetHomepage() + 'calculator/?player=' + steamID;
			element.title = 'SteamDB Calculator';
			element.appendChild( text );
			
			container.appendChild( element );
		}
	}
} );
