'use strict';

( ( () =>
{
	const originalOrderPollingComplete = window.OrderPollingComplete;

	window.OrderPollingComplete = function SteamDB_OrderPollingComplete()
	{
		originalOrderPollingComplete.apply( this, arguments );

		// Verify that all purchases succeeded
		for( let iOrder = 0; iOrder < window.g_rgItemNameIds.length; iOrder++ )
		{
			const order = window.g_rgOrders[ iOrder ];

			if( order.m_nQuantity < 1 )
			{
				continue;
			}

			if( !order.m_bOrderSuccess )
			{
				return;
			}

			const success = document.getElementById( `buy_${order.m_llNameId}_success` );

			// If the success checkmark is not visible, something went wrong
			if( !success || !success.checkVisibility() )
			{
				return;
			}
		}

		const params = new URLSearchParams( window.location.search );
		const returnTo = params.get( 'steamdb_return_to' );

		if( returnTo === null )
		{
			return;
		}

		const returnToUrl = new URL( returnTo );

		// Verify that we're returning to the same origin
		if( returnToUrl.origin !== window.location.origin )
		{
			return;
		}

		window.location = returnToUrl.toString();
	};
} )() );
