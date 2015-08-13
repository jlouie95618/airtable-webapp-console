'use strict';

var Class = require('./vendor/class.js');

var Console = Class.extend({
    init: function() {
        this._table = hyperbaseForFrameAccess.getActiveTableModel();
        this._baseId = hyperbaseForFrameAccess.getActiveApplicationModel().getId();
        this._apiConsole = $('<div/>').addClass('api-console');
        this._apiConsole.append($('<div/>').append('var Airtable = require("airtable");'));
        this._apiConsole.append($('<div/>').append('var base = new Airtable({ apiKey: "YOUR_API_KEY" }).base(' + this._baseId + ');'));
        var that = this;
        var keyValuesInRecord = {};
        var updateContainer;
        var before;
        var after;
        var currentColumn;
        var currentColumnElement;
        var currentRecord;

        // Logic pertaining to when edits are peformed directly to the rows
        this._table.bindToBeginEditingRow(function(recordId){
            that._table.unbindFromCellValueChange();
            console.log('BEGIN: ', arguments, recordId);
            before = that._table.getCellValuesByColumnId(arguments[0]);
            that._table.bindToCellValueChange(inRowCellChanges);
        });

        this._table.bindToEndEditingRow(function(recordId) { 
            console.log('ENDED: ', arguments, recordId);
            after = that._table.getCellValuesByColumnId(arguments[0]);
            if (before !== after) {
                console.log('differences occured');
            }
            that._table.unbindFromCellValueChange();
        });

        // Logic pertaining to when edits are taking place in the expanded view
        this._table.bindToRowExpanded(function(recordId) {
            that._table.unbindFromCellValueChange();
            console.log('EXPANDED: ', arguments, recordId);
            that._table.bindToCellValueChange(inExpandedViewCellChanges);
            $('.detailView>.dialog').append(that._apiConsole);
        });

        this._table.bindToRowCollapsed(function(recordId) {
            console.log('COLLAPSED: ', arguments, recordId);
            // Clean away all the unecessary previous API consoles
            $('.api-console').remove();
            that._table.unbindFromCellValueChange();
        });

        // Call back functions
        function inRowCellChanges() {
            // console.log('CELL VALUE CHANGED in row view: ', arguments);
            // var columns = this._table.getCellValuesByColumnId(arguments[0]);
            // currentColumn = arguments[1];
            // console.log(columns[currentColumn]);
            // updateString += columns[currentColumn] + '\n';
            // if (this._table.getExpandedRowId()) {
            //     this._apiConsole.append(updateString);
            // }
        }

        function inExpandedViewCellChanges(recordId, columnId) {// arguments[recordId, fieldId, undefined]
            console.log('record and column ids: ', recordId, columnId);
            var columns = that._table.getCellValuesByColumnId(arguments[0]);
            console.log('CELL VALUE CHANGED in expanded view: ', arguments);
            console.log('column value: ', columns[arguments[1]]);
            if (currentRecord !== arguments[0]) { // changed the record (i.e. different expanded record)
                keyValuesInRecord = {};
                updateContainer = updateApiCall(arguments[0], 
                    that._table.getColumnById(arguments[1]).getName(), 
                    outputValue(columns[arguments[1]]));
                console.log('updateContainer:', updateContainer);
                currentColumnElement = updateContainer.children('.update-value').children('.key-value');
                that._apiConsole.append(updateContainer);
                currentRecord = arguments[0];
                currentColumn = arguments[1];
            } else if (currentColumn !== arguments[1]) { // you've changed which field you're modifying
                console.log('SANITY CHECK', that._table.getColumnById(arguments[1]).getName() in keyValuesInRecord, that._table.getColumnById(arguments[1]).getName(), keyValuesInRecord);
                if (that._table.getColumnById(arguments[1]).getName() in keyValuesInRecord) { // find the field if it's already been changed in this session
                    currentColumnElement = keyValuesInRecord[that._table.getColumnById(arguments[1]).getName()];
                    console.log('currentColumn that already exists: ', currentColumn);
                } else { // create a new key-value div for newly modified fields
                    currentColumnElement = constructKeyValueDiv(
                        that._table.getColumnById(arguments[1]).getName(),
                        outputValue(columns[arguments[1]])
                    );
                    updateContainer.children('.update-value').append(currentColumnElement);
                }
                currentColumn = arguments[1];
            } else { // we're still in the same column/field
                
            }
            currentColumnElement.text(
                '"' + that._table.getColumnById(currentColumn).getName() + 
                '": ' + outputValue(columns[currentColumn])
            );
        }

        // Misc Functions
        function updateApiCall(recordId, columnName, value) {
            var container = $('<div/>').addClass('update-container');
            var keyValuePair = constructKeyValueDiv(columnName, value);
            container.append($('<div/>').append('base("' + that._table.getName() + '").update(' + recordId + ', {'));
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




    }

});

module.exports = Console;
