'use strict';

( ( () =>
{
	const script = document.getElementById( 'steamdb_registerkey_hook' );
	const originalOnRegisterProductKeyFailure = window.OnRegisterProductKeyFailure;

	window.OnRegisterProductKeyFailure = function SteamDB_OnRegisterProductKeyFailure( ePurchaseResult, receipt )
	{
		originalOnRegisterProductKeyFailure.apply( this, arguments );

		if( receipt?.line_items && receipt.line_items.length > 0 )
		{
			document.getElementById( 'error_display' ).appendChild( FormatLineItems( receipt.line_items ) );
		}
	};

	window.UpdateReceiptForm = function SteamDB_UpdateReceiptForm( result )
	{
		const list = document.getElementById( 'registerkey_productlist' );

		while( list.firstChild )
		{
			list.firstChild.remove();
		}

		list.appendChild( FormatLineItems( result.purchase_receipt_info.line_items ) );
	};

	function FormatLineItems( line_items )
	{
		const fragment = document.createElement( 'div' );
		fragment.className = 'steamdb_registerkey_lineitem';

		const image = document.createElement( 'img' );
		image.src = script.dataset.icon;

		for( const item of line_items )
		{
			const lineitem = document.createElement( 'div' );
			lineitem.className = 'registerkey_lineitem';
			lineitem.append( image );

			let link = document.createElement( 'a' );
			link.href = script.dataset.homepage + 'sub/' + item.packageid + '/';
			link.rel = 'noreferrer';
			link.target = '_blank';
			link.appendChild( document.createTextNode( 'SteamDB' ) );

			lineitem.append( link );
			lineitem.appendChild( document.createTextNode( ' - ' ) );

			link = document.createElement( 'a' );
			link.href = 'steam://subscriptioninstall/' + item.packageid;
			link.appendChild( document.createTextNode( 'Install' ) );

			lineitem.append( link );
			lineitem.appendChild( document.createTextNode( ' - ' + item.line_item_description ) );

			fragment.appendChild( lineitem );
		}

		return fragment;
	}
} )() );
