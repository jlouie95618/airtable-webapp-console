(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var Class = require('./vendor/class.js');


var table = hyperbaseForFrameAccess.getActiveTableModel();
var baseId = hyperbaseForFrameAccess.getActiveApplicationModel().getId();
var apiConsole = $('<div/>').addClass('api-console');
apiConsole.append($('<div/>').append('var Airtable = require("airtable");'));
apiConsole.append($('<div/>').append('var base = new Airtable({ apiKey: "YOUR_API_KEY" }).base(' + baseId + ');'));
var keyValuesInRecord = {};
var updateContainer;
var before;
var after;
var currentColumn;
var currentColumnElement;
var currentRecord;

// Logic pertaining to when edits are peformed directly to the rows
table.bindToBeginEditingRow(function(){
    table.unbindFromCellValueChange();
    console.log('BEGIN: ', arguments);
    before = table.getCellValuesByColumnId(arguments[0]);
    table.bindToCellValueChange(inRowCellChanges);
});

table.bindToEndEditingRow(function() { 
    console.log('ENDED: ', arguments);
    after = table.getCellValuesByColumnId(arguments[0]);
    if (before !== after) {
        console.log('differences occured');
    }
    table.unbindFromCellValueChange();
});

// Logic pertaining to when edits are taking place in the expanded view
table.bindToRowExpanded(function() {
    table.unbindFromCellValueChange();
    console.log('EXPANDED: ', arguments);
    table.bindToCellValueChange(inExpandedViewCellChanges);
    $('.detailView>.dialog').append(apiConsole);
});

table.bindToRowCollapsed(function() {
    console.log('COLLAPSED: ', arguments);
    // Clean away all the unecessary previous API consoles
    $('.api-console').remove();
    table.unbindFromCellValueChange();
});

// Call back functions
function inRowCellChanges() {
    // console.log('CELL VALUE CHANGED in row view: ', arguments);
    // var columns = table.getCellValuesByColumnId(arguments[0]);
    // currentColumn = arguments[1];
    // console.log(columns[currentColumn]);
    // updateString += columns[currentColumn] + '\n';
    // if (table.getExpandedRowId()) {
    //     apiConsole.append(updateString);
    // }
}

function inExpandedViewCellChanges() {// arguments[recordId, fieldId, undefined]
    var columns = table.getCellValuesByColumnId(arguments[0]);
    console.log('CELL VALUE CHANGED in expanded view: ', arguments);
    console.log('column value: ', columns[arguments[1]]);
    if (currentRecord !== arguments[0]) { // changed the record (i.e. different expanded record)
        keyValuesInRecord = {};
        updateContainer = updateApiCall(arguments[0], 
            table.getColumnById(arguments[1]).getName(), 
            outputValue(columns[arguments[1]]));
        console.log('updateContainer:', updateContainer);
        currentColumnElement = updateContainer.children('.update-value').children('.key-value');
        apiConsole.append(updateContainer);
        currentRecord = arguments[0];
        currentColumn = arguments[1];
    } else if (currentColumn !== arguments[1]) { // you've changed which field you're modifying
        console.log('SANITY CHECK', table.getColumnById(arguments[1]).getName() in keyValuesInRecord, table.getColumnById(arguments[1]).getName(), keyValuesInRecord);
        if (table.getColumnById(arguments[1]).getName() in keyValuesInRecord) { // find the field if it's already been changed in this session
            currentColumnElement = keyValuesInRecord[table.getColumnById(arguments[1]).getName()];
            console.log('currentColumn that already exists: ', currentColumn);
        } else { // create a new key-value div for newly modified fields
            currentColumnElement = constructKeyValueDiv(
                table.getColumnById(arguments[1]).getName(),
                outputValue(columns[arguments[1]])
            );
            updateContainer.children('.update-value').append(currentColumnElement);
        }
        currentColumn = arguments[1];
    } else { // we're still in the same column/field
        
    }
    currentColumnElement.text(
        '"' + table.getColumnById(currentColumn).getName() + 
        '": ' + outputValue(columns[currentColumn])
    );
    // currentColumn = arguments[1];
    // console.log(columns[currentColumn]);
    // updateString += columns[currentColumn] + '\n';
    // if (table.getExpandedRowId()) {
    //     apiConsole.append(updateString);
    // }
}

// Misc Functions
function updateApiCall(recordId, columnName, value) {
    var container = $('<div/>').addClass('update-container');
    var keyValuePair = constructKeyValueDiv(columnName, value);
    container.append($('<div/>').append('base("' + table.getName() + '").update(' + recordId + ', {'));
    container.append($('<div/>').append(keyValuePair).addClass('update-value'));
    container.append($('<div/>').append('}'));
    return container;
}

function constructKeyValueDiv(columnName, value) {
    var keyValue = $('<div/>').append('"' + columnName + '": ' + value).addClass('key-value');
    keyValuesInRecord[columnName] = keyValue;
    console.log('saved key value pair...', columnName, keyValue, keyValuesInRecord);
    return keyValue;
}

function outputValue(input) {
    var result = '';
    var first = true;
    if (typeof input === 'string') {
        result = JSON.stringify(input);
    } else if (input === null) {
        result = input;
    } else if (typeof input === 'object') {
        if (Object.prototype.toString.call(input) === '[object Object]') {
            result += '{';
            // $.each(input, function(key, value) {
            //     if (first) {
            //         result += (' "' + key + '": ' + outputValue(value));                  
            //         first = false;
            //     } else {
            //         result += (', "' + key + '": ' + outputValue(value));
            //     }
            // });
            if (input.url) {
                result += '"url": "' + input.url + '"';
            }
            result += ' }';
        } else if (Object.prototype.toString.call(input) === '[object Array]') {
            result += '[ ';
            input.forEach(function(elem) {
                if (first) {
                    result += outputValue(elem);
                    first = false;
                } else {
                    result += ', ' + outputValue(elem);
                }
            });
            result += ' ]';
        }
    } else {
        result = input;
    }
    return result;
}

},{"./vendor/class.js":2}],2:[function(require,module,exports){
/*jshint strict:false */

/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
// http://ejohn.org/blog/simple-javascript-inheritance/
(function(){
    var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

    // The base Class implementation (does nothing)
    var Class = function(){};

    // Create a new Class that inherits from this class
    Class.extend = function extender(prop) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
                typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                (function(name, fn){
                    return function() {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]) :
            prop[name];
        }

        // The dummy class constructor
        function Class() {
            // All construction is actually done in the init method
            if ( !initializing && this.init )
                this.init.apply(this, arguments);
        }

        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;

        // And make this class extendable
        Class.extend = extender;

        return Class;
    };

    if (typeof exports !== 'undefined') {
        module.exports = Class;
    } else {
        window.Class = Class;
    }
})();
},{}]},{},[1]);
