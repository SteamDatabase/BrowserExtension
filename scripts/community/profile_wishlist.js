'use strict';

var brokenImages = document.querySelectorAll( 'img[src*="338200c5d6c4d9bdcf6632642a2aeb591fb8a5c2"]' );

for( var i = 0; i < brokenImages.length; i++ )
{
	brokenImages[ i ].src = '//steamcdn-a.akamaihd.net/steam/apps/' + GetAppIDFromUrl( brokenImages[ i ].parentNode.href ) + '/capsule_184x69.jpg';
}
