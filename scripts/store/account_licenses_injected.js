'use strict';

( ( () =>
{
	if( document.body )
	{
		PerformHook();
	}
	else
	{
		// If the script was injected too early, wait for <body> element to be created
		const observer = new MutationObserver( () =>
		{
			if( document.body )
			{
				PerformHook();

				observer.disconnect();
			}
		} );

		observer.observe( document, {
			childList: true,
			subtree: true,
		} );
	}

	function PerformHook()
	{
		const noop = () =>
		{
			// noop
		};

		window.InstrumentLinks = noop;
		window.BindTooltips = noop;

		if( window.GDynamicStore )
		{
			window.GDynamicStore.Init = noop;
		}

		// As Valve's own comment says this function is for "perf sensitive pages"
		if( window.DisableTooltipMutationObserver )
		{
			window.DisableTooltipMutationObserver();
		}
	}
} )() );
