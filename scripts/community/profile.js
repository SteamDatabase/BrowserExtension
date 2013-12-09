var container = document.querySelector( '#profile_action_dropdown .popup_body' );

if( !container )
{
	if( document.getElementById( 'inventory_link_753' ) )
	{
		element = document.createElement( 'script' );
		element.id = 'steamdb_inventory_hook';
		element.type = 'text/javascript';
		element.src = chrome.extension.getURL( 'scripts/community/inventory.js' ); // TODO: abstract
		element.dataset.homepage = GetHomepage();
		
		document.head.appendChild( element );
	}
}
else
{
	// Can't access g_rgProfileData inside sandbox
	var steamID = location.pathname.match( /^\/(id|profiles)\/([^\s/]+)\/?$/ );
	
	var image = document.createElement( 'img' );
	image.src = chrome.extension.getURL( 'icons/18.png' ); // TODO: abstract
	
	var element = document.createElement( 'a' );
	element.href = GetHomepage() + 'calculator/?player=' + steamID[ 2 ];
	element.target = '_blank';
	element.className = 'popup_menu_item';
	element.appendChild( image );
	element.appendChild( document.createTextNode( ' SteamDB Calculator' ) );
	
	container.insertBefore( element, null );
}
