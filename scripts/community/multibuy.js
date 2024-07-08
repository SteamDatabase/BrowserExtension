'use strict';

const script = document.createElement( 'script' );
script.id = 'steamdb_multibuy';
script.type = 'text/javascript';
script.src = GetLocalResource( 'scripts/community/multibuy_injected.js' );
document.head.append( script );
