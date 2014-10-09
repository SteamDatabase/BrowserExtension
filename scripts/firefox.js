'use strict';

var pageMod = require( 'sdk/page-mod' );
var data = require( 'sdk/self' ).data;

var manifest = JSON.parse( data.load( 'manifest.json' ) );

var x, i, scriptOptions =
{
	firefox: true,
	preferences: require( 'sdk/simple-prefs' ).prefs
};

for( i = 0; i < manifest.web_accessible_resources.length; i++ )
{
	var file = manifest.web_accessible_resources[ i ];
	
	scriptOptions[ file ] = data.url( file );
}

var contentScripts = manifest.content_scripts;

for( i = 0; i < contentScripts.length; i++ )
{
	var contentScript = contentScripts[ i ];
	
	var pageMatch =
	{
		include: [],
		contentScriptFile: [],
		contentStyleFile: [],
		contentScriptOptions: scriptOptions
	};
	
	for( x = 0; x < contentScript.matches.length; x++ )
	{
		var match = contentScript.matches[ x ].replace( /\*/g, '.*' ).replace( /[\/]/g, '\/' );
		
		pageMatch.include.push( new RegExp( match ) );
	}
	
	for( x = 0; x < contentScript.js.length; x++ )
	{
		pageMatch.contentScriptFile.push( data.url( contentScript.js[ x ] ) );
	}
	
	if( contentScript.css )
	{
		for( x = 0; x < contentScript.css.length; x++ )
		{
			pageMatch.contentStyleFile.push( data.url( contentScript.css[ x ] ) );
		}
	}
	
	if( contentScript.exclude_matches )
	{
		pageMatch.exclude = [];
		
		for( x = 0; x < contentScript.exclude_matches.length; x++ )
		{
			var match = contentScript.exclude_matches[ x ].replace( /\*/g, '.*' ).replace( /[\/]/g, '\/' );
			
			pageMatch.exclude.push( new RegExp( match ) );
		}
	}
	
	pageMod.PageMod( pageMatch );
}
