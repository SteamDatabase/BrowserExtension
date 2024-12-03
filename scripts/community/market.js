'use strict';

const script = document.createElement( 'script' );
script.id = 'steamdb_market_script';
script.type = 'text/javascript';
script.src = GetLocalResource( 'scripts/community/market_injected.js' );
document.documentElement.append( script );
