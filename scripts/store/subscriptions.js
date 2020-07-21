( function()
{
	'use strict';

	const homepage = document.getElementById( 'steamdb_subscriptions_hook' ).dataset.homepage;
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
		link.href = `${homepage}sub/${subId}/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension`;
		link.querySelector( '.steamdb_subid' ).textContent = `Sub ${subId}`;
	};
}() );
