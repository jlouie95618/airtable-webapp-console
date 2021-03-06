'use strict';

var Class = require('../vendor/class.js');

var GenericMethod = Class.extend({
    init: function(tableName, recordId, language, prevLastConsoleLineNum) {
        this._recordId = recordId;
        this._language = language;
        this._columnNameToReplaceRangeInfo = {};
        this._result = '';
        this._currLineObject = '';
        this._prevLastLineNum = prevLastConsoleLineNum;

    },
    outputAsString: function() {
        return this._result;
    },
    updateParameters: function(currCm, columns, currColumnId, currColumn) {
        var that = this;
        var columnName = currColumn.getName();
        this._currColumn = currColumn;
        // Have we changed which column we're modifying?
        if (currColumnId !== this._currentColumnIdBeingModified) {
            // Have we already seen the column we're modifying?
            if (columnName in this._columnNameToReplaceRangeInfo) {
                this._currLineObject = this._columnNameToReplaceRangeInfo[columnName];
                this._currLineObject.value = this._outputValue(columns[currColumnId]);
                this._currLineNum = this._currLineObject.lineNum;
            } else { // No, we haven't so create new key-value div
                this._constructNewLine(columnName, 
                    this._outputValue(columns[currColumnId]));
            }         
            this._currentColumnIdBeingModified = currColumnId;
        } else {
            this._currLineObject.value = this._outputValue(columns[this._currentColumnIdBeingModified]);
        }
        if (this._isNotCountFormulaLookupRollupType()) {
            currCm.replaceRange(
                this._convertLineObjectToString(this._currLineObject),
                {
                    line: this._currLineNum,
                    ch: 0
                }, {
                    line: this._currLineNum,
                    ch: undefined
                }
            );
        }
    },
    _constructNewLine: function(columnName, value) {
        if (this._isNotCountFormulaLookupRollupType()) {
            this._currLineNum = this._lastLineNum - 1;
            this._currLineObject = {
                'lineNum': this._currLineNum,
                'columnName': columnName,
                'value': value + '\n'
            };
            this._lastLineNum += 1;
            this._columnNameToReplaceRangeInfo[columnName] = this._currLineObject;
        }
    },
    _convertLineObjectToString: function(lineObject, isNew) {
        var result;
        if (lineObject) {
            result = '\t"' + lineObject.columnName + '": ' + lineObject.value;
        } else { result = ''; }
        return result;
    },
    // This method basically just takes into account the different field
    //  types and creates the corresponding API call for a given change
    _outputValue: function(input) {
        var result = '';
        var first = true;
        var that = this;
        if (typeof input === 'string') {
            if ((this._currColumn.getType() === 'select' || 
                this._currColumn.getType() === 'multiSelect') &&
                this._currColumn.getTypeOptions()) { // situation when we've got a select option
                input = this._currColumn.getTypeOptions().choices[input].name;
            }
            result = JSON.stringify(input);
        } else if (input === null) {
            result = input;
        } else if (typeof input === 'object') {
            if (Object.prototype.toString.call(input) === '[object Object]') {
                result += '{';
                if (input.url) { result += '"url": "' + input.url + '"'; }
                result += ' }';
            } else if (Object.prototype.toString.call(input) === '[object Array]') {
                result += '[ ';
                input.forEach(function(elem) {
                    if (first) { first = false; } 
                    else { result += ', ';  }
                    if (that._currColumn.getType() === 'foreignKey') {
                        result += that._outputValue(elem.foreignRowId);
                    } else {
                        result += that._outputValue(elem);
                    }
                });
                result += ' ]';
            }
        } else {
            result = input;
        }
        return result;
    },
    // Make sure we check for these types because they are not technically
    //  directly changeable the API
    _isNotCountFormulaLookupRollupType: function() {
        var currColumnType;
        if (this._currColumn) {
            currColumnType = this._currColumn.getType();
            return (currColumnType !== 'count' && 
                currColumnType !== 'formula' &&
                currColumnType !== 'lookup' &&
                currColumnType !== 'rollup');
        } else {
            return false;
        }
    }
});

module.exports = GenericMethod;
