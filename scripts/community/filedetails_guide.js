'use strict';

if( document.querySelector( '.guideTopContent' ) )
{
	const guide = document.querySelector( '.guide' );

	if( guide.querySelector( '.bb_spoiler' ) )
	{
		const StartViewTransition = ( callback ) =>
		{
			if( document.startViewTransition )
			{
				document.startViewTransition( () =>
				{
					try
					{
						callback();
					}
					catch( e )
					{
						console.error( e );
					}
				} );
			}
			else
			{
				callback();
			}
		};

		const controls = document.querySelector( '#ItemControls' );

		const divider = document.createElement( 'div' );
		divider.className = 'vertical_divider';
		controls.append( divider );

		const checkboxWrapper = document.createElement( 'label' );
		checkboxWrapper.textContent = _t( 'spoilers_reveal' );
		checkboxWrapper.className = 'workshopItemControlCtn general_btn';
		checkboxWrapper.style.gap = '5px';

		const checkbox = document.createElement( 'input' );
		checkbox.type = 'checkbox';
		checkbox.style.colorScheme = 'dark';
		checkbox.style.margin = 0;
		checkbox.style.cursor = 'pointer';
		checkboxWrapper.prepend( checkbox );
		controls.append( checkboxWrapper );

		checkbox.addEventListener( 'change', event =>
		{
			const spoilers = guide.querySelectorAll( '.bb_spoiler,.steamdb_spoiler_revealed' );
			const reveal = event.target.checked;

			checkboxWrapper.style.backgroundColor = reveal ? '#2d6bcd' : '';
			checkboxWrapper.style.color = reveal ? '#fff' : '';

			StartViewTransition( () =>
			{
				for( const spoiler of spoilers )
				{
					spoiler.classList.toggle( 'steamdb_spoiler_revealed', reveal );
					spoiler.classList.toggle( 'bb_spoiler', !reveal );
				}
			} );
		} );
	}
}
