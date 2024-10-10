'use strict';

const script = document.createElement( 'script' );
script.id = 'steamdb_disable_tooltips';
script.type = 'text/javascript';
script.src = GetLocalResource( 'scripts/community/market_injected.js' );
document.documentElement.append( script );

GetOption( { 'enhancement-market': true }, ( items ) =>
{
	if( !items[ 'enhancement-market' ] )
	{

	}

} );
