( function()
{
	'use strict';

	let DiscoveryQueueModal;

	const buttonContainer = document.createElement( 'div' );
	buttonContainer.className = 'discovery_queue_customize_ctn';

	const button = document.createElement( 'div' );
	button.className = 'btnv6_blue_hoverfade btn_medium';
	let span = document.createElement( 'span' );
	span.appendChild( document.createTextNode( 'Auto-discover' ) );
	button.appendChild( span );
	buttonContainer.appendChild( button );

	span = document.createElement( 'span' );
	span.appendChild( document.createTextNode( 'Automatically discover the queue to get an event card.' ) );
	buttonContainer.appendChild( span );

	const script = document.getElementById( 'steamdb_explore_queue' );
	const image = document.createElement( 'img' );
	image.src = script.dataset.icon;
	image.width = 32;
	image.height = 32;
	image.style.float = 'right';
	buttonContainer.appendChild( image );

	const container = document.querySelector( '.discovery_queue_customize_ctn' );
	container.parentNode.insertBefore( buttonContainer, container );

	button.addEventListener( 'click', function( )
	{
		GenerateQueue();
		buttonContainer.remove( );
	}, false );

	function GenerateQueue()
	{
		if( DiscoveryQueueModal )
		{
			DiscoveryQueueModal.Dismiss();
		}

		DiscoveryQueueModal = window.ShowBlockingWaitDialog( 'Generating the queue…', 'Generating new discovery queue, this can fail if Steam is under high load.' );

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
				DiscoveryQueueModal = window.ShowBlockingWaitDialog( 'Exploring the queue…', 'Request ' + ++done + ' of ' + data.queue.length );
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
				DiscoveryQueueModal = window.ShowConfirmDialog( 'Done', 'Queue has been explored', 'Reload the page' ).done( function( )
				{
					window.ShowBlockingWaitDialog( 'Reloading the page' );
					window.location.reload();
				} );
			};

			window.jQuery.when( ...requests ).then( callback, callback );
		} )
			.fail( function()
			{
				setTimeout( GenerateQueue, 5000 );

				DiscoveryQueueModal.Dismiss();
				DiscoveryQueueModal = window.ShowBlockingWaitDialog( 'Error', 'Failed to generate new queue, trying again in five seconds…' );
			} );
	}
}() );
