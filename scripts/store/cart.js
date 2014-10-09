'use strict';

var container = document.querySelector( '.page_content > .leftcol' );

if( container )
{
	var cartItem = document.querySelector( '.cart_item' );
	
	var element = document.createElement( 'span' );
	element.appendChild( document.createTextNode( 'Empty cart' ) );
	
	var link = document.createElement( 'a' );
	link.className = 'btn_medium btnv6_blue_hoverfade' + ( cartItem ? '' : ' btn_disabled' );
	link.href = '#';
	link.style.cssFloat = 'right';
	link.appendChild( element );
	
	if( cartItem )
	{
		// NukeCartCookie from Valve's checkout.js
		link.addEventListener( 'click', function( ev )
		{
			ev.preventDefault();
			
			var date = new Date();
			date.setFullYear( date.getFullYear() - 30 );
			date = date.toGMTString();
			
			document.cookie = 'shoppingCartGID' + '=-1; expires=' + date + '; path=/';
			document.cookie = 'workshopShoppingCartGID' + '=-1; expires=' + date + '; path=/';
			
			window.location.href = window.location.pathname + window.location.search; // location.reload() re-submits POST data
		}, false );
	}
	
	container.appendChild( link );
}
