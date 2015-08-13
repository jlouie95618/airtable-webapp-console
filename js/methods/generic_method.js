'use strict';

var Class = require('../vendor/class.js');

var GenericMethod = Class.extend({
    init: function(tableName, recordId) {
        this._recordId = recordId;
        this._columnNameToDivElem = {};
        this._container = $('<div/>').addClass('update-container');
        this._currKeyValue = $('<div/>').addClass('key-value');
        this._updateValue = $('<div/>').addClass('update-value');
    },
    outputContainer: function() {
        return this._container;
    },
    updateParameters: function(columns, currColumnId, columnName) {
        var that = this;
        if (currColumnId !== this._currentColumnIdBeingModified) { // well we changed which column we're modifying
            if (columnName in this._columnNameToDivElem) { // have we already seen the column we're modifying?
                this._currKeyValue = this._columnNameToDivElem[columnName];
            } else { // no we haven't so create new key-value div
                this._constructKeyValueDiv(columnName, 
                    this._outputValue(columns[currColumnId]));
            }         
            this._currentColumnIdBeingModified = currColumnId;
        }

        console.log('this._currentColumnIdBeingModified: ', this._currentColumnIdBeingModified);
        console.log('columns: ', columns);

        this._currKeyValue.text(
            '"' + columnName + 
            '": ' + this._outputValue(columns[this._currentColumnIdBeingModified])
        );
        
    },
    _constructKeyValueDiv: function(columnName, value) {
        this._currKeyValue = $('<div/>').append('"' + columnName + '": ' + value).addClass('key-value');
        this._columnNameToDivElem[columnName] = this._currKeyValue;
        this._updateValue.append(this._currKeyValue);
        console.log('saved key value pair...', columnName, this._currKeyValue, this._columnNameToDivElem);
        return this._currKeyValue;
    },
    _outputValue: function(input) {
        var result = '';
        var first = true;
        if (typeof input === 'string') {
            result = JSON.stringify(input);
        } else if (input === null) {
            result = input;
        } else if (typeof input === 'object') {
            if (Object.prototype.toString.call(input) === '[object Object]') {
                result += '{';
                if (input.url) {
                    result += '"url": "' + input.url + '"';
                }
                result += ' }';
            } else if (Object.prototype.toString.call(input) === '[object Array]') {
                result += '[ ';
                input.forEach(function(elem) {
                    if (first) {
                        result += this._outputValue(elem);
                        first = false;
                    } else {
                        result += ', ' + this._outputValue(elem);
                    }
                });
                result += ' ]';
            }
        } else {
            result = input;
        }
        return result;
    }
});

module.exports = GenericMethod;
