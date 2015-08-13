'use strict';

var Class = require('./vendor/class.js');

var RecordFinder = require('./record_finder.js');
var Update = require('./methods/update.js');
var Create = require('./methods/create.js');
var Delete = require('./methods/delete.js');
var Method = require('./methods/generic_method.js');

var Console = Class.extend({
    init: function() {
        var that = this;
        console.log('hyperbaseForFrameAccess: ', hyperbaseForFrameAccess);
        this._table = hyperbaseForFrameAccess.getActiveTableModel();
        this._baseId = hyperbaseForFrameAccess.getActiveApplicationModel().getId();
        this._keyValuesInRecord = {};
        this._apiConsole = $('<div/>').addClass('api-console');
        this._apiConsole.append($('<div/>').append('var Airtable = require("airtable");'));
        this._apiConsole.append($('<div/>').append('var base = new Airtable({ apiKey: "YOUR_API_KEY" }).base(' + this._baseId + ');'));

        // Logic pertaining to when edits are peformed directly to the rows
        this._table.bindToBeginEditingRow(function(recordId) {
            that._handleRowBeginEdit(recordId);
        });
        this._table.bindToEndEditingRow(function(recordId) {
            that._handleRowEndEdit(recordId);
        });

        // Logic pertaining to when edits are taking place in the expanded view
        this._table.bindToRowExpanded(function(recordId) {
            that._handleExpandedRowBeginEdit(recordId);
        });
        this._table.bindToRowCollapsed(function(recordId) {
            that._handleExpandedRowEndEdit(recordId);
        });

        // Logic pertaining to when a new row is created by the user
        this._table.bindToRowCreatedFromUser(function(recordId) {
            console.log('ROW CREATED: ', arguments, recordId);
        });

        // Logic pertaining to when a user deletes one or more records
        this._table.bindToMultipleRowsDestroyedFromUser(function(recordIds) {
            that._handleMultipleRowsDestroyed(recordIds);
        });

    },





    _handleMultipleRowsDestroyed: function(recordIds) {
        console.log('ROW(S) DESTROYED: ', recordIds);
        recordIds.forEach(function(recordId, index) {
            var deletedRecord = new Delete(
                this._table.getName(), recordId
            );
            this._apiConsole.append(deletedRecord.outputContainer());
        });
    },





    _handleRowBeginEdit: function(recordId){
        var that = this;
        this._table.unbindFromCellValueChange();
        console.log('BEGIN: ', arguments, recordId);
        this._table.bindToCellValueChange(function(recordId, columnId) {
            that._inRowCellChanges(recordId, columnId);
        });
    },
    _handleRowEndEdit: function(recordId) { 
        console.log('ENDED: ', arguments, recordId);
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
    _inRowCellChanges: function(recordId, columnId) {
        console.log('recordId and columnId: ', recordId, columnId);
    },
    _inExpandedViewCellChanges: function(recordId, columnId) {// arguments[recordId, fieldId, undefined]
        var columns = this._table.getCellValuesByColumnId(recordId);
        if (this._currentRecord !== recordId) { // changed the record (i.e. different expanded record)
            this._currentMethodInstance = new Update(
                this._table.getName(), recordId
            );
            this._apiConsole.append(this._currentMethodInstance.outputContainer());
            this._currentRecord = recordId;
        }
        this._currentMethodInstance.updateParameters(columns, 
            columnId, this._table.getColumnById(columnId).getName());
    }
});

module.exports = Console;
