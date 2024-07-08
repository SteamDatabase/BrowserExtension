( function()
{
	'use strict';

	const originalOrderPollingComplete = window.OrderPollingComplete;

	window.OrderPollingComplete = function SteamDB_OrderPollingComplete()
	{
		originalOrderPollingComplete.apply( this, arguments );

		// Verify that all purchases succeeded
		for( let iOrder = 0; iOrder < window.g_rgItemNameIds.length; iOrder++ )
		{
			const order = window.g_rgOrders[ iOrder ];

			if( order.m_nQuantity > 0 && !order.m_bOrderSuccess )
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
}() );
