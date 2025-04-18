'use strict';

const multibuyScript = document.createElement( 'script' );
multibuyScript.id = 'steamdb_multibuy';
multibuyScript.type = 'text/javascript';
multibuyScript.src = GetLocalResource( 'scripts/community/multibuy_injected.js' );
document.head.append( multibuyScript );
