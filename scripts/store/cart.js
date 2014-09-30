// Only insert button if there are items in the cart
if( document.querySelector( '.cart_item' ) )
{
	var container = document.querySelector( '.page_content > .leftcol' );

	if( container )
	{
		var element = document.createElement( 'span' );
		element.appendChild( document.createTextNode( 'Empty cart' ) );
		
		var link = document.createElement( 'a' );
		link.className = 'btn_medium btnv6_blue_hoverfade';
		link.href = '#';
		link.style.float = 'right';
		link.appendChild( element );
		
		// NukeCartCookie from Valve's checkout.js
		link.addEventListener( 'click', function( ev )
		{
			ev.preventDefault();
			
			var date = new Date();
			date.setFullYear( date.getFullYear() - 30 );
			date = date.toGMTString();
			
			document.cookie = 'shoppingCartGID' + '=-1; expires=' + date + '; path=/';
			document.cookie = 'workshopShoppingCartGID' + '=-1; expires=' + date + '; path=/';
			
			window.location.reload();
		}, false );
		
		container.appendChild( link );
	}
}
