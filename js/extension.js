'use strict'; // indicate to use Strict Mode

console.log('EXTENSION: ', $);

var script = $('<script/>');
script.attr('src', 'https://airtable-webapp-console.s3-us-west-1.amazonaws.com/test.js');
$('head').append(script);

// script.attr('src', 'http://localhost:8000/test.js');
// $('head').append(script);