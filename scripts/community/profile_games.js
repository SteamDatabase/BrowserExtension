'use strict';

const element = document.createElement( 'script' );
element.id = 'steamdb_profile_games';
element.type = 'text/javascript';
element.dataset.homepage = GetHomepage();
element.dataset.view_on_steamdb = _t( 'view_on_steamdb' );
element.dataset.steamdb_is_optimizing = _t( 'steamdb_is_optimizing' );
element.src = GetLocalResource( 'scripts/community/profile_games_injected.js' );

document.documentElement.appendChild( element );
