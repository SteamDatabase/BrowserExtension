'use strict';

if( document.getElementById( 'inventory_link_753' ) )
{
	GetOption( { 'link-inventory': true, 'link-inventory-gift-subid': true }, function( items )
	{
		if( !items[ 'link-inventory' ] )
		{
			return;
		}
		
		if( items[ 'link-inventory-gift-subid' ] )
		{
			document.body.dataset.steamdbGiftSubid = 'true';
		}
		
		var element = document.createElement( 'script' );
		element.id = 'steamdb_inventory_hook';
		element.type = 'text/javascript';
		element.src = GetLocalResource( 'scripts/community/inventory.js' );
		element.dataset.homepage = GetHomepage();
		
		document.head.appendChild( element );
	} );
}
