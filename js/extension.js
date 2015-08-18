'use strict'; // indicate to use Strict Mode

var mainScript = $('<script/>');
var codemirrorJs = $('<script/>'); 
var javascript = $('<script/>');
var python = $('<script/>'); 
var ruby = $('<script/>');
var codeMirrorCss = $('<link/>');
var css = $('<link/>');
codemirrorJs.attr('src', 'https://airtable-webapp-console.s3-us-west-1.amazonaws.com/build/additional-resources/codemirror.js');
javascript.attr('src', 'https://airtable-webapp-console.s3-us-west-1.amazonaws.com/build/additional-resources/javascript.js');
python.attr('src', 'https://airtable-webapp-console.s3-us-west-1.amazonaws.com/build/additional-resources/python.js');
ruby.attr('src', 'https://airtable-webapp-console.s3-us-west-1.amazonaws.com/build/additional-resources/ruby.js');
codeMirrorCss.attr('href', 'https://airtable-webapp-console.s3-us-west-1.amazonaws.com/build/additional-resources/codemirror.css');
codeMirrorCss.attr('rel', 'stylesheet');
codeMirrorCss.attr('type', 'text/css');

// Appending vendor code first
$('head').append(codemirrorJs);
// $('head').append(javascript);
// $('head').append(python);
// $('head').append(ruby);
$('head').append(codeMirrorCss);

// My code
mainScript.attr('src', 'https://airtable-webapp-console.s3-us-west-1.amazonaws.com/build/js/bundle.js');
$('head').append(mainScript);
css.attr('href', 'https://airtable-webapp-console.s3-us-west-1.amazonaws.com/build/css/api_console_style.css');
css.attr('rel', 'stylesheet');
css.attr('type', 'text/css');
$('head').append(css);