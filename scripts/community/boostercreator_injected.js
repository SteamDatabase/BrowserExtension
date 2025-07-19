'use strict';

/** @type {HTMLSelectElement} */
const gameSelector = document.querySelector( '#booster_game_selector' );

if( gameSelector )
{
	// Add an event listener to catch when the game selector changes and emit new rgBoosterData
	gameSelector.addEventListener( 'change', emitBoosterAvailableDate );

	// Emit rgBoosterData for current selection when the script loads
	emitBoosterAvailableDate();
}

function emitBoosterAvailableDate( )
{
	const selectedGame = gameSelector.value;
	const rgBoosterData = window.CBoosterCreatorPage.sm_rgBoosterData[ selectedGame ];

	gameSelector.dispatchEvent( new CustomEvent( 'boosterPackChange', { detail: rgBoosterData } ) );
}
