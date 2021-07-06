'use strict';

const element = document.createElement( 'script' );
element.id = 'steamdb_explore_queue';
element.type = 'text/javascript';
element.dataset.icon = GetLocalResource( 'icons/white.svg' );
element.src = GetLocalResource( 'scripts/store/explore_injected.js' );

document.head.appendChild( element );

// Fix Valve's bug where empty queue banner has wrong height and it hides text
const emptyQueue = document.querySelector( '.discover_queue_empty' );

if( emptyQueue )
{
	emptyQueue.style.height = 'auto';
}
