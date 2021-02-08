( function()
{
	'use strict';

	let DiscoveryQueueModal;

	const buttonContainer = document.createElement( 'div' );
	buttonContainer.className = 'discovery_queue_customize_ctn';

	const button = document.createElement( 'div' );
	button.className = 'btnv6_blue_hoverfade btn_medium';

	let span = document.createElement( 'span' );
	span.appendChild( document.createTextNode( 'Cheat 3x' ) );
	button.appendChild( span );
	buttonContainer.appendChild( button );

	const button1x = document.createElement( 'div' );
	button1x.className = 'btnv6_blue_hoverfade btn_medium';
	span = document.createElement( 'span' );
	span.appendChild( document.createTextNode( 'Cheat 1x' ) );
	button1x.appendChild( span );
	buttonContainer.appendChild( button1x );

	span = document.createElement( 'span' );
	span.appendChild( document.createTextNode( 'Discover the queue to get the sale cards' ) );
	buttonContainer.appendChild( span );

	const container = document.querySelector( '.discovery_queue_customize_ctn' );
	container.parentNode.insertBefore( buttonContainer, container );

	button.addEventListener( 'click', function( )
	{
		GenerateQueue( 0, 3 );
		buttonContainer.remove( );
	}, false );

	button1x.addEventListener( 'click', function( )
	{
		GenerateQueue( 0, 1 );
		buttonContainer.remove( );
	}, false );

	function GenerateQueue( queueNumber, limit )
	{
		if( DiscoveryQueueModal )
		{
			DiscoveryQueueModal.Dismiss();
		}

		DiscoveryQueueModal = window.ShowBlockingWaitDialog( 'Generating the queue...', 'Generating new discovery queue #' + ++queueNumber + '. This can fail if Steam is under high load.' );

		window.jQuery.post( '/explore/generatenewdiscoveryqueue', { sessionid: window.g_sessionID, queuetype: 0 } ).done( function( data )
		{
			const requests = [];
			let done = 0;
			let errorShown;

			const requestDone = function( )
			{
				if( errorShown )
				{
					return;
				}

				DiscoveryQueueModal.Dismiss();
				DiscoveryQueueModal = window.ShowBlockingWaitDialog( 'Exploring the queue...', 'Request ' + ++done + ' of ' + data.queue.length );
			};

			const requestFail = function( )
			{
				if( errorShown )
				{
					return;
				}

				errorShown = true;

				DiscoveryQueueModal.Dismiss();
				DiscoveryQueueModal = window.ShowBlockingWaitDialog( 'Error', 'Failed to clear queue item #' + ++done + '. Will try again soon.' );
			};

			for( let i = 0; i < data.queue.length; i++ )
			{
				const request = window.jQuery.post( '/app/10', { appid_to_clear_from_queue: data.queue[ i ], sessionid: window.g_sessionID } );

				request.done( requestDone );
				request.fail( requestFail );

				requests.push( request );
			}

			const callback = function()
			{
				DiscoveryQueueModal.Dismiss();

				if( queueNumber < limit )
				{
					GenerateQueue( queueNumber, limit );
				}
				else
				{
					DiscoveryQueueModal = window.ShowConfirmDialog( 'Done', 'Queue has been explored ' + queueNumber + ' times', 'Reload the page' ).done( function( )
					{
						window.ShowBlockingWaitDialog( 'Reloading the page' );
						window.location.reload();
					} );
				}
			};

			window.jQuery.when( ...requests ).then( callback, callback );
		} )
			.fail( function()
			{
				setTimeout( () => GenerateQueue( queueNumber - 1, limit ), 1000 );

				DiscoveryQueueModal.Dismiss();
				DiscoveryQueueModal = window.ShowBlockingWaitDialog( 'Error', 'Failed to generate new queue #' + queueNumber + '. Trying again in a second.' );
			} );
	}
}() );
