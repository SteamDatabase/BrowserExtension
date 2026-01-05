'use strict';

if( document.getElementById( 'inventory_link_753' ) )
{
	GetOption( {
		'link-inventory': true,
		'enhancement-inventory-sidebar': true,
		'enhancement-inventory-quick-sell': true,
		'enhancement-inventory-quick-sell-auto': false,
		'enhancement-inventory-no-sell-reload': true,
		'enhancement-inventory-badge-info': true,
	}, ( items ) =>
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

		const element = document.createElement( 'script' );
		element.id = 'steamdb_inventory_hook';
		element.type = 'text/javascript';
		element.src = GetLocalResource( 'scripts/community/inventory.js' );
		element.dataset.homepage = GetHomepage();
		element.dataset.logo = GetLocalResource( 'icons/white.svg' );
		element.dataset.optionsUrl = GetLocalResource( 'options/options.html' ) + '#inventory';
		element.dataset.options = JSON.stringify( items );
		element.dataset.i18n = JSON.stringify( {
			steamdb_options: _t( 'steamdb_options' ),
			view_on_steamdb: _t( 'view_on_steamdb' ),
			in_library: _t( 'in_library' ),
			inventory_quick_sell_tip: _t( 'inventory_quick_sell_tip' ),
			inventory_list_at: _t( 'inventory_list_at' ),
			inventory_sell_at: _t( 'inventory_sell_at' ),
			inventory_list_at_title: _t( 'inventory_list_at_title' ),
			inventory_sell_at_title: _t( 'inventory_sell_at_title' ),
			inventory_badge_level: _t( 'inventory_badge_level' ),
			inventory_badge_foil_level: _t( 'inventory_badge_foil_level' ),
			inventory_badge_none: _t( 'inventory_badge_none' ),
		} );

		document.head.appendChild( element );
	} );
}
