'use strict';

var Class = require('./vendor/class.js');

var keyValuesInRecord = {};
var updateContainer;
var before;
var after;
var currentColumn;
var currentColumnElement;
var currentRecord;

var Console = Class.extend({
    init: function() {
        var that = this;
        console.log('hyperbaseForFrameAccess: ', hyperbaseForFrameAccess);
        this._table = hyperbaseForFrameAccess.getActiveTableModel();
        this._baseId = hyperbaseForFrameAccess.getActiveApplicationModel().getId();
        this._apiConsole = $('<div/>').addClass('api-console');
        this._apiConsole.append($('<div/>').append('var Airtable = require("airtable");'));
        this._apiConsole.append($('<div/>').append('var base = new Airtable({ apiKey: "YOUR_API_KEY" }).base(' + this._baseId + ');'));

        // Logic pertaining to when edits are peformed directly to the rows
        this._table.bindToBeginEditingRow(function(recordId) {
            this._handleRowBeginEdit(recordId);
        });

        this._table.bindToEndEditingRow(function(recordId) {
            that._handleRowEndEdit(recordId);
        });

        // Logic pertaining to when edits are taking place in the expanded view
        this._table.bindToRowExpanded(function(recordId) {
            console.log('test: ', arguments);
            that._handleExpandedRowBeginEdit(recordId);
        });

        this._table.bindToRowCollapsed(function(recordId) {
            that._handleExpandedRowEndEdit(recordId);
        });

    },
    _handleRowBeginEdit: function(recordId){
        this._table.unbindFromCellValueChange();
        console.log('BEGIN: ', arguments, recordId);
        before = this._table.getCellValuesByColumnId(recordId);
        this._table.bindToCellValueChange(this._inRowCellChanges);
    },
    _handleRowEndEdit: function(recordId) { 
        console.log('ENDED: ', arguments, recordId);
        after = this._table.getCellValuesByColumnId(recordId);
        if (before !== after) {
            console.log('differences occured');
        }
        this._table.unbindFromCellValueChange();
    },
    _handleExpandedRowBeginEdit: function(recordId) {
        var that = this;
        console.log(this._table);
        this._table.unbindFromCellValueChange();
        console.log('EXPANDED: ', arguments, recordId);
        this._table.bindToCellValueChange(function(recordId, columnId) {
            that._inExpandedViewCellChanges(recordId, columnId);
        });
        $('.detailView>.dialog').append(this._apiConsole);
    },
    _handleExpandedRowEndEdit: function(recordId) {
        console.log('COLLAPSED: ', arguments, recordId);
        // Clean away all the unecessary previous API consoles
        $('.api-console').remove();
        this._table.unbindFromCellValueChange();
    },
    // Call back functions
    _inRowCellChanges: function() {
        // console.log('CELL VALUE CHANGED in row view: ', arguments);
        // var columns = this._table.getCellValuesByColumnId(arguments[0]);
        // currentColumn = arguments[1];
        // console.log(columns[currentColumn]);
        // updateString += columns[currentColumn] + '\n';
        // if (this._table.getExpandedRowId()) {
        //     this._apiConsole.append(updateString);
        // }
    },
    _inExpandedViewCellChanges: function(recordId, columnId) {// arguments[recordId, fieldId, undefined]
        console.log('record and column ids: ', recordId, columnId);
        console.log(this._table);
        var columns = this._table.getCellValuesByColumnId(arguments[0]);
        console.log('CELL VALUE CHANGED in expanded view: ', arguments);
        console.log('column value: ', columns[arguments[1]]);
        if (currentRecord !== arguments[0]) { // changed the record (i.e. different expanded record)
            keyValuesInRecord = {};
            updateContainer = this._updateApiCall(arguments[0], 
                this._table.getColumnById(arguments[1]).getName(), 
                this._outputValue(columns[arguments[1]]));
            console.log('updateContainer:', updateContainer);
            currentColumnElement = updateContainer.children('.update-value').children('.key-value');
            this._apiConsole.append(updateContainer);
            currentRecord = arguments[0];
            currentColumn = arguments[1];
        } else if (currentColumn !== arguments[1]) { // you've changed which field you're modifying
            console.log('SANITY CHECK', this._table.getColumnById(arguments[1]).getName() in keyValuesInRecord, this._table.getColumnById(arguments[1]).getName(), keyValuesInRecord);
            if (this._table.getColumnById(arguments[1]).getName() in keyValuesInRecord) { // find the field if it's already been changed in this session
                currentColumnElement = keyValuesInRecord[this._table.getColumnById(arguments[1]).getName()];
                console.log('currentColumn this already exists: ', currentColumn);
            } else { // create a new key-value div for newly modified fields
                currentColumnElement = this._constructKeyValueDiv(
                    this._table.getColumnById(arguments[1]).getName(),
                    this._outputValue(columns[arguments[1]])
                );
                updateContainer.children('.update-value').append(currentColumnElement);
            }
            currentColumn = arguments[1];
        } else { // we're still in the same column/field
            
        }
        currentColumnElement.text(
            '"' + this._table.getColumnById(currentColumn).getName() + 
            '": ' + this._outputValue(columns[currentColumn])
        );
    },
    // Misc Functions
    _updateApiCall: function(recordId, columnName, value) {
        var container = $('<div/>').addClass('update-container');
        var keyValuePair = this._constructKeyValueDiv(columnName, value);
        container.append($('<div/>').append('base("' + this._table.getName() + '").update(' + recordId + ', {'));
        container.append($('<div/>').append(keyValuePair).addClass('update-value'));
        container.append($('<div/>').append('}'));
        return container;
    },
    _constructKeyValueDiv: function(columnName, value) {
        var keyValue = $('<div/>').append('"' + columnName + '": ' + value).addClass('key-value');
        keyValuesInRecord[columnName] = keyValue;
        console.log('saved key value pair...', columnName, keyValue, keyValuesInRecord);
        return keyValue;
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

module.exports = Console;
