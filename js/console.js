'use strict';

var Class = require('./vendor/class.js');
var CodeMirror = require('codemirror');
console.log(CodeMirror);
require('../node_modules/codemirror/mode/javascript/javascript.js');
require('../node_modules/codemirror/mode/python/python.js');
require('../node_modules/codemirror/mode/ruby/ruby.js');

var RecordFinder = require('./record_finder.js');
var Update = require('./methods/update.js');
var Create = require('./methods/create.js');
var Delete = require('./methods/delete.js');
var Method = require('./methods/generic_method.js');

var Console = Class.extend({
    init: function() {
        console.log('hyperbaseForFrameAccess: ', hyperbaseForFrameAccess);
        this._table = hyperbaseForFrameAccess.getActiveTableModel();
        this._baseId = hyperbaseForFrameAccess.getActiveApplicationModel().getId();
        this._keyValuesInRecord = {};
        this._apiConsole = $('<div/>').addClass('api-console');
        // Variables that pertain to the creation of CodeMirror instances
        this._textareaIds = ['javascript-textarea', 'python-textarea', 'ruby-textarea'];
        this._textareaMode = ['javascript', 'python', 'ruby'];
        this._codeMirrorInstances = [];
        this._currCodeMirror = null;
        // Initialization of various elements and listeners:
        this._apiConsole.append(this._generateLanguageOptionsMenu());
        this._generateCodeMirrorInstances();
        this._initializeBindings();
    },

    _generateCodeMirrorInstances: function() {
        var that = this;
        this._textareaIds.forEach(function(id, index) {
            that._codeMirrorInstances[index] = new CodeMirror(function(elem) {
                $(elem).attr('id', that._textareaIds[index]);
                $(that._apiConsole).append($(elem));
            }, {
                value: that._outputDefaultMessages(id),
                mode: that._textareaMode[index],
                lineNumbers: true
            });
        });
    },

    _outputDefaultMessages: function(id) {
        if (id === 'javascript-textarea') {
            return '// JavaScript Client\n\'console\'\n\'what is going on\'';
        } else if (id === 'python-textarea') {
            return '# Python Client - thanks to ____';
        } else if (id === 'ruby-textarea') {
            return '# Ruby Client - thanks to ____';
        }
    },

    _generateLanguageOptionsMenu: function() {
        var that = this;
        var options = this._createLanguageSelection();
        options.on('change', function() {
            that._language = $(this).val();
            that._isLanguageInitialized = false;
            if (that._language === 'javascript') {
                $(that._codeMirrorInstances[1].getWrapperElement()).hide();
                $(that._codeMirrorInstances[2].getWrapperElement()).hide();
                $(that._codeMirrorInstances[0].getWrapperElement()).show();
                that._currCodeMirror = that._codeMirrorInstances[0];
                that._currCodeMirror.refresh();
                that._isLanguageInitialized = true;
            } else if (that._language === 'python') {
                $(that._codeMirrorInstances[0].getWrapperElement()).hide();
                $(that._codeMirrorInstances[2].getWrapperElement()).hide();
                $(that._codeMirrorInstances[1].getWrapperElement()).show();
                that._currCodeMirror = that._codeMirrorInstances[1];
                that._currCodeMirror.refresh();
                that._isLanguageInitialized = true;
            } else if (that._language === 'ruby') {
                $(that._codeMirrorInstances[0].getWrapperElement()).hide();
                $(that._codeMirrorInstances[1].getWrapperElement()).hide();
                $(that._codeMirrorInstances[2].getWrapperElement()).show();
                that._currCodeMirror = that._codeMirrorInstances[2];
                that._currCodeMirror.refresh();
                that._isLanguageInitialized = true;
            } else {
                $(that._codeMirrorInstances[0].getWrapperElement()).hide();
                $(that._codeMirrorInstances[1].getWrapperElement()).hide();
                $(that._codeMirrorInstances[2].getWrapperElement()).hide();
                that._currCodeMirror = null;
            }
        });
        return $('<div/>').append('Choose an API language: ').append(options).addClass('console-message');
    },

    _createLanguageSelection: function() {
        var options = $('<select/>').addClass('language-options');
        options.append($('<option/>').append(''));
        options.append($('<option/>').attr('value', 'javascript').append('JavaScript'));
        options.append($('<option/>').attr('value', 'python').append('Python'));
        options.append($('<option/>').attr('value', 'ruby').append('Ruby'));
        return options;
    },

    _initializeBindings: function() {
        var that = this;
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
            that._handleRowCreated(recordId);
        });

        // Logic pertaining to when a user deletes one or more records
        this._table.bindToMultipleRowsDestroyedFromUser(function(recordIds) {
            that._handleMultipleRowsDestroyed(recordIds);
        });

        // Logic pertaining to collaborator changes
        // TODO        
    },

    _handleRowCreated: function(recordId) {
        console.log('ROW CREATED: ', recordId);
        this._rowCreated = true;
        console.log('this._rowCreated JUST SET: ', this._rowCreated);
    },
    _handleMultipleRowsDestroyed: function(recordIds) {
        var that = this;
        console.log('ROW(S) DESTROYED: ', recordIds);
        recordIds.forEach(function(recordId, index) {
            var deletedRecord = new Delete(
                that._table.getName(), recordId
            );
            that._apiConsole.append(deletedRecord.outputContainer());
        });
    },

    _handleRowBeginEdit: function(recordId){
        var that = this;
        // this._table.unbindFromCellValueChange();
        console.log('this._rowCreated: ', this._rowCreated);
        if (this._rowCreated) {
            console.log('BEGIN (post created a row):', recordId);
            this._rowCreated = false;
            this._table.bindToCellValueChange(function(recordId, columnId) {
                console.log('row begin edit arguments: ', arguments);
                if (that._isLanguageInitialized) { 
                    that._inNewRowCellChanges(recordId, columnId); 
                }
            });
        } else {
            console.log('BEGIN (normal): ', recordId);
            this._table.bindToCellValueChange(function(recordId, columnId) {
                console.log('row begin edit arguments (normal): ', arguments);
                if (that._isLanguageInitialized) { 
                    that._inRowCellChanges(recordId, columnId); 
                }
            });
        }
    },
    _handleRowEndEdit: function(recordId) { 
        console.log('ENDED: ', arguments, recordId);
        this._table.unbindFromCellValueChange();
    },

    _handleExpandedRowBeginEdit: function(recordId) {
        var that = this;
        console.log(this._table);
        // this._table.unbindFromCellValueChange();
        console.log('EXPANDED: ', arguments, recordId);
        this._table.bindToCellValueChange(function(recordId, columnId) {
            console.log('row expanded edit arguments: ', arguments);
            if (that._isLanguageInitialized) { 
                that._inExpandedViewCellChanges(recordId, columnId); 
            }
        });
        $('.detailView>.dialog').append(this._apiConsole);
        this._codeMirrorInstances.forEach(function(cm) {
            $(cm.getWrapperElement()).hide();
        });
    },

    _handleExpandedRowEndEdit: function(recordId) {
        console.log('COLLAPSED: ', arguments, recordId);
        // Clean away all the unecessary previous API consoles
        $('.api-console').remove();
        this._table.unbindFromCellValueChange();
    },

    // Call back functions
    _inNewRowCellChanges: function(recordId, columnId) {
        var columns = this._table.getCellValuesByColumnId(recordId);
        if (this._currentRecord !== recordId) {
            this._currentMethodInstance = new Create(this._table.getName());
            this._apiConsole.append(this._currentMethodInstance.outputContainer());
            this._currentRecord = recordId;            
        }
        this._currentMethodInstance.updateParameters(columns, 
            columnId, this._table.getColumnById(columnId));
    },
    _inRowCellChanges: function(recordId, columnId) {
        console.log('recordId and columnId: ', recordId, columnId);
        this._inExpandedViewCellChanges(recordId, columnId);
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
            columnId, this._table.getColumnById(columnId));
    }
});

module.exports = Console;
