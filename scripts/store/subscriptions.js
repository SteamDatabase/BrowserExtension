'use strict';

( ( () =>
{
	const scriptHook = document.getElementById( 'steamdb_subscriptions_hook' );
	const homepage = scriptHook.dataset.homepage;
	const originalDropdownSelectOption = window.GamePurchaseDropdownSelectOption;

	/**
	 * @param {string} dropdownName
	 * @param {number} subId
	 */
	window.GamePurchaseDropdownSelectOption = function SteamDB_GamePurchaseDropdownSelectOption( dropdownName, subId )
	{
		originalDropdownSelectOption.apply( this, arguments );

		const cartForm = document.getElementById( `add_to_cart_${dropdownName}` );

		if( !cartForm )
		{
			return;
		}

		/** @type {HTMLAnchorElement} */
		const link = cartForm.parentNode.querySelector( '.steamdb_link' );
		link.hidden = false;
		link.href = `${homepage}sub/${subId}/`;
		link.querySelector( '.steamdb_link_id' ).textContent = subId.toString();
	};
} )() );
