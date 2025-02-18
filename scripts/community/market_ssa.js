'use strict';

GetOption( { 'enhancement-market-ssa': false }, ( items ) =>
{
	if( items[ 'enhancement-market-ssa' ] )
	{
		/** @type {HTMLInputElement} */
		let element = document.getElementById( 'market_buynow_dialog_accept_ssa' );

		if( element )
		{
			element.checked = true;
		}

		element = document.getElementById( 'market_buyorder_dialog_accept_ssa' );

		if( element )
		{
			element.checked = true;
		}

		element = document.getElementById( 'market_sell_dialog_accept_ssa' );

		if( element )
		{
			element.checked = true;
		}
	}
} );
