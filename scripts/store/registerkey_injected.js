( function()
{
	'use strict';

	const script = document.getElementById( 'steamdb_registerkey_hook' );
	const originalOnRegisterProductKeyFailure = window.OnRegisterProductKeyFailure;

	window.OnRegisterProductKeyFailure = function SteamDB_OnRegisterProductKeyFailure( ePurchaseResult, receipt )
	{
		originalOnRegisterProductKeyFailure.apply( this, arguments );

		if( receipt && receipt.line_items )
		{
			document.getElementById( 'error_display' ).innerHTML += '<br><br>' + FormatLineItems( receipt.line_items );
		}
	};

	window.UpdateReceiptForm = function SteamDB_UpdateReceiptForm( result )
	{
		document.getElementById( 'registerkey_productlist' ).innerHTML = FormatLineItems( result.purchase_receipt_info.line_items );
	};

	function FormatLineItems( line_items )
	{
		let strLines = '';

		for( const item of line_items )
		{
			strLines +=
				'<div class="registerkey_lineitem">' +
				'<img src="' + script.dataset.icon + '" alt="SteamDB" title="View on SteamDB" width="16" height="16" style="vertical-align:middle">' +
				'<a href="' + script.dataset.homepage + 'sub/' + item.packageid + '/?utm_source=Steam&amp;utm_medium=Steam&amp;utm_campaign=SteamDB%20Extension" target="_blank">' +
				'SteamDB</a> - <a href="steam://subscriptioninstall/' + item.packageid + '">Install</a> - ' +
				item.line_item_description.replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ) +
				'</div>';
		}

		return strLines;
	}
}() );
