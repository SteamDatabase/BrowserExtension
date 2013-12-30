var container = document.querySelector( '#profile_action_dropdown .popup_body' );

if( container )
{
	// Can't access g_rgProfileData inside sandbox
	var steamID = location.pathname.match( /^\/(?:id|profiles)\/([^\s/]+)\/?/ );
	
	var image = document.createElement( 'img' );
	image.src = GetLocalResource( 'icons/18.png' );
	
	var element = document.createElement( 'a' );
	element.href = GetHomepage() + 'calculator/?player=' + steamID[ 1 ];
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
		// Can't access g_rgProfileData inside sandbox
		var steamID = location.pathname.match( /^\/(?:id|profiles)\/([^\s/]+)\/?/ );
		
		var text = document.createElement( 'span' );
		text.appendChild( document.createTextNode( 'SteamDB Calculator' ) );
		
		element = document.createElement( 'a' );
		element.className = 'btn_profile_action btn_medium steamdb_button';
		element.target = '_blank';
		element.href = GetHomepage() + 'calculator/?player=' + steamID[ 1 ];
		element.appendChild( text );
		
		container.appendChild( element );
	}
}