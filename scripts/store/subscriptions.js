( function()
{
	'use strict';

	const scriptHook = document.getElementById( 'steamdb_subscriptions_hook' );
	const homepage = scriptHook.dataset.homepage;
	const localizedText = scriptHook.dataset.i18n;
	const originalDropdownSelectOption = window.GamePurchaseDropdownSelectOption;

	window.GamePurchaseDropdownSelectOption = function SteamDB_GamePurchaseDropdownSelectOption( dropdownName, subId )
	{
		originalDropdownSelectOption.apply( this, arguments );

		let link = document.getElementById( `add_to_cart_${dropdownName}` );

		if( !link )
		{
			return;
		}

		link = link.parentNode.querySelector( '.steamdb_link' );
		link.href = `${homepage}sub/${subId}/`;
		link.querySelector( '.steamdb_subid' ).textContent = localizedText.replace( '%subid%', subId.toString() );
	};
}() );
