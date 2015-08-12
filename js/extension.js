'use strict'; // indicate to use Strict Mode

var script = $('<script/>');
var css = $('<link/>');
script.attr('src', 'https://airtable-webapp-console.s3-us-west-1.amazonaws.com/test.js');
css.attr('href', 'https://airtable-webapp-console.s3-us-west-1.amazonaws.com/test.css');
css.attr('rel', 'stylesheet');
css.attr('type', 'text/css');
$('head').append(script);
$('head').append(css);