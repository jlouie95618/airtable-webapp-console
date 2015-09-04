'use strict'; // indicate to use Strict Mode

var codeMirrorCss = $('<link/>');
var css = $('<link/>');

// Appending vendor code first
codeMirrorCss.attr('href', 'https://airtable-webapp-console.s3-us-west-1.amazonaws.com/build/additional-resources/codemirror.css');
codeMirrorCss.attr('rel', 'stylesheet');
codeMirrorCss.attr('type', 'text/css');
$('head').append(codeMirrorCss);

// My code
mainScript.attr('src', 'https://airtable-webapp-console.s3-us-west-1.amazonaws.com/build/js/bundle.js');
$('head').append(mainScript);
css.attr('href', 'https://airtable-webapp-console.s3-us-west-1.amazonaws.com/build/css/api_console_style.css');
css.attr('rel', 'stylesheet');
css.attr('type', 'text/css');
$('head').append(css);