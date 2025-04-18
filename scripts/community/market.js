'use strict';

const marketScript = document.createElement( 'script' );
marketScript.id = 'steamdb_market_script';
marketScript.type = 'text/javascript';
marketScript.src = GetLocalResource( 'scripts/community/market_injected.js' );
document.documentElement.append( marketScript );
