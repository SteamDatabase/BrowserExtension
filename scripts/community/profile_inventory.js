'use strict';

if( document.getElementById( 'inventory_link_753' ) )
{
	GetOption( {
		'link-inventory': true,
		'link-inventory-gift-subid': true,
		'enhancement-inventory-sidebar': true,
		'enhancement-inventory-quick-sell': true,
		'enhancement-inventory-quick-sell-auto': false,
		'enhancement-inventory-no-sell-reload': true,
	}, function( items )
	{
		if( items[ 'enhancement-inventory-sidebar' ] )
		{
			const style = document.createElement( 'link' );
			style.id = 'steamdb_inventory_sidebar';
			style.type = 'text/css';
			style.rel = 'stylesheet';
			style.href = GetLocalResource( 'styles/inventory-sidebar.css' );

			document.head.appendChild( style );
		}

		if( items[ 'link-inventory' ] )
		{
			document.body.dataset.steamdbLinks = 'true';
		}

		if( items[ 'link-inventory-gift-subid' ] )
		{
			document.body.dataset.steamdbGiftSubid = 'true';
		}

		if( items[ 'enhancement-inventory-quick-sell' ] )
		{
			document.body.dataset.steamdbQuickSell = 'true';
		}

		if( items[ 'enhancement-inventory-quick-sell-auto' ] )
		{
			document.body.dataset.steamdbQuickSellAuto = 'true';
		}

		if( items[ 'enhancement-inventory-no-sell-reload' ] )
		{
			document.body.dataset.steamdbNoSellReload = 'true';
		}

		const element = document.createElement( 'script' );
		element.id = 'steamdb_inventory_hook';
		element.type = 'text/javascript';
		element.src = GetLocalResource( 'scripts/community/inventory.js' );
		element.dataset.homepage = GetHomepage();

		document.head.appendChild( element );
	} );
}
