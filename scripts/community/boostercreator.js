'use strict';

const script = document.createElement( 'script' );
script.id = 'steamdb_boostercreator';
script.type = 'text/javascript';
script.src = GetLocalResource( 'scripts/community/boostercreator_injected.js' );
document.head.appendChild( script );
