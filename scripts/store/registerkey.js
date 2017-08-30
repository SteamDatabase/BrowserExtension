'use strict';

GetOption( { 'enhancement-market-ssa': true }, function( items )
{
	if( items[ 'enhancement-market-ssa' ] )
	{
		var element = document.getElementById( 'accept_ssa' );
		
		if( element )
		{
			element.checked = true;
		}
	}
} );
