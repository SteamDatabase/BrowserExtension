'use strict';

const element = document.createElement( 'script' );
element.id = 'steamdb_explore_queue';
element.type = 'text/javascript';
element.src = GetLocalResource( 'scripts/store/explore_injected.js' );

document.head.appendChild( element );
