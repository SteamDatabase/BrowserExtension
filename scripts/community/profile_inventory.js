if( document.getElementById( 'inventory_link_753' ) )
{
	chrome.storage.local.get( 'link-inventory', function( items )
	{
		if( items[ 'link-inventory' ] === true )
		{
			return;
		}
		
		var element = document.createElement( 'script' );
		element.id = 'steamdb_inventory_hook';
		element.type = 'text/javascript';
		element.src = GetLocalResource( 'scripts/community/inventory.js' );
		element.dataset.homepage = GetHomepage();
		
		document.head.appendChild( element );
	} );
}
