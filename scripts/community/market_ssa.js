GetOption( [ 'enhancement-market-ssa' ], function( items )
{
	if( items[ 'enhancement-market-ssa' ] === false )
	{
		var element = document.getElementById( 'market_buynow_dialog_accept_ssa' );
 		
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
