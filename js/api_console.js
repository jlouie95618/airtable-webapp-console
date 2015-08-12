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
