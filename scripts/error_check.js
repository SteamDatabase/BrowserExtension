// There's no easier way to check if we're on error page :(
if( document.title === 'Sorry!' && document.body.style.backgroundImage === 'url(http://cdn.store.steampowered.com/public/images/v5/content_bg.png)' )
{
	var element = document.createElement( 'div' );
	element.className = 'steamdb_downtime_container';
	element.innerHTML = 'Steam appears to be experiencing some downtime. <a href="//steamstat.us" target="_blank">View network status on SteamDB</a>';
	
	var container = document.createElement( 'div' );
	container.className = 'steamdb_downtime';
	container.appendChild( element );
	
	document.body.insertBefore( container, document.body.firstChild );
	
	document.body.style.margin = 0;
}
