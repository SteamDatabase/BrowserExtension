'use strict';

GetOption( { 'enhancement-market-ssa': false }, ( items ) =>
{
	if( items[ 'enhancement-market-ssa' ] )
	{
		/** @type {HTMLInputElement} */
		let element = document.querySelector( '#market_buynow_dialog_accept_ssa' );

		if( element )
		{
			element.checked = true;
		}

		element = document.querySelector( '#market_buyorder_dialog_accept_ssa' );

		if( element )
		{
			element.checked = true;
		}

		element = document.querySelector( '#market_sell_dialog_accept_ssa' );

		if( element )
		{
			element.checked = true;
		}
	}
} );
