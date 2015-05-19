'use strict';

if( document.getElementById( 'inventory_link_753' ) )
{
	GetOption( { 'link-inventory': true, 'link-inventory-gift-subid': true, 'enhancement-inventory-sidebar': true }, function( items )
	{
		if( items[ 'enhancement-inventory-sidebar' ] )
		{
			var style = document.createElement( 'link' );
			style.id = 'steamdb_inventory_sidebar';
			style.type = 'text/css';
			style.rel = 'stylesheet';
			style.href = GetLocalResource( 'styles/inventory-sidebar.css' );
			
			document.head.appendChild( style );
		}
		
		if( items[ 'link-inventory' ] )
		{
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
		}
	} );
}
