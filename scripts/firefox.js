var pageMod = require("sdk/page-mod");
var data = require("sdk/self").data;

var manifest = JSON.parse( data.load( 'manifest.json' ) );

var scriptOptions =
{
	firefox: true
};

for( var i = 0; i < manifest.web_accessible_resources.length; i++ )
{
	var file = manifest.web_accessible_resources[ i ];
	
	scriptOptions[ file ] = data.url( file );
}

var contentScripts = manifest.content_scripts;

for( var i = 0; i < contentScripts.length; i++ )
{
	var contentScript = contentScripts[ i ];
	
	var pageMatch =
	{
		include: [],
		contentScriptFile: [],
		contentStyleFile: [],
		contentScriptOptions: scriptOptions
	};
	
	for( var x = 0; x < contentScript.matches.length; x++ )
	{
		var match = contentScript.matches[ x ].replace(/\*/g, ".*").replace(/[\/]/g, "\/");
		
		pageMatch.include.push( new RegExp( match ) );
	}
	
	for( var x = 0; x < contentScript.js.length; x++ )
	{
		pageMatch.contentScriptFile.push( data.url( contentScript.js[ x ] ) );
	}
	
	if( contentScript.css )
	{
		for( var x = 0; x < contentScript.css.length; x++ )
		{
			pageMatch.contentStyleFile.push( data.url( contentScript.css[ x ] ) );
		}
	}
	
	pageMod.PageMod( pageMatch );
}
