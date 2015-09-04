'use strict';

var Class = require('./vendor/class.js');
var CodeMirror = require('codemirror');
// Import the different language modes using Node/npm
require('../node_modules/codemirror/mode/javascript/javascript.js');
require('../node_modules/codemirror/mode/python/python.js');
require('../node_modules/codemirror/mode/ruby/ruby.js');
// require('../node_modules/codemirror/addon/display/autorefresh.js');

var RecordFinder = require('./record_finder.js');
var Update = require('./methods/update.js');
var Create = require('./methods/create.js');
var Delete = require('./methods/delete.js');
var Method = require('./methods/generic_method.js');

var Console = Class.extend({
    // Currently, the tag below works because it appends the console to the expanded
    //  view dialog box; however, if changes are made to the class/id names,
    //  the constant below (and most likely other tags) will have to be changed
    _DIALOG_TAG: '.detailViewWithActivityFeedBase>.dialog',
    init: function() {
        this._table = hyperbaseForFrameAccess.getActiveTableModel();
        this._baseId = hyperbaseForFrameAccess.getActiveApplicationModel().getId();
        this._keyValuesInRecord = {};
        this._apiConsole = $('<div/>').addClass('api-console');
        // Variables that pertain to the creation of CodeMirror instances
        this._cmIds = ['javascript-cm', 'python-cm', 'ruby-cm'];
        this._cmMode = ['javascript', 'python', 'ruby'];
        this._codeMirrorInstances = [];
        this._currCodeMirror = null;
        // Initialization of various elements and listeners:
        this._apiConsole.append(this._generateLanguageOptionsMenu());
        this._generateCodeMirrorInstances();
        this._initializeBindings();
    },

    _generateCodeMirrorInstances: function() {
        var that = this;
        // Iterate through the different CodeMirror tags and 
        //  generate the CodeMirror instances for each.
        this._cmIds.forEach(function(id, index) {
            that._codeMirrorInstances[index] = new CodeMirror(function(elem) {
                $(elem).attr('id', that._cmIds[index]);
                $(that._apiConsole).append($(elem));
            }, {
                value: that._outputDefaultMessages(id),
                mode: that._cmMode[index],
                lineNumbers: true,
                lineWrapping: true,
                readOnly: true
            });
            $(that._codeMirrorInstances[index].getWrapperElement()).hide();
        });
    },

    _outputDefaultMessages: function(id) {
        if (id === 'javascript-cm') {
            return '// JavaScript Client\n' + 
                'var Airtable = require(\'airtable\');\n' + 
                'var base = new Airtable({ \n' + 
                '\tapiKey: \'YOUR_API_KEY\' \n' + 
                '}).base(\'' + this._baseId + '\');\n';
        } else if (id === 'python-cm') {
            return '# Python Client - thanks to Nicolo Canali De Rossi (nicocanali)\n' + 
                'import airtable\n' + 
                'at = airtable.Airtable(\'' + this._baseId + '\', \'YOUR_API_KEY\')\n';
        } else if (id === 'ruby-cm') {
            return '# Ruby Client - thanks to Nathan Esquenazi (nesquena)';
        }
    },

    _generateLanguageOptionsMenu: function() {
        var that = this;
        if (!this._options) {
            this._options = $('<select/>').addClass('language-options');
            this._options.append($('<option/>').append(''));
            this._options.append($('<option/>').attr('value', 'javascript').append('JavaScript'));
            this._options.append($('<option/>').attr('value', 'python').append('Python'));
            this._options.append($('<option/>').attr('value', 'ruby').append('Ruby'));
        }
        return $('<div/>').append('Choose an API language: ').append(this._options).addClass('console-message');
    },

    _initializeBindings: function() {
        var that = this;
        // Logic pertaining to when edits are performed directly to the rows
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
        this._table.bindToMultipleRowsDestroyedFromUser(function(deletedRecordIds) {
            that._handleMultipleRowsDestroyed(deletedRecordIds);
        });

        // Logic pertaining to collaborator changes
        // TODO        
    },

    _handleRowCreated: function(recordId) {
        // Set flag that'll be used to alter the row update/edit
        //  behavior to match the API's create (instead of update)
        this._rowCreated = true;
    },
    _handleMultipleRowsDestroyed: function(deletedRecordIds) {
        var that = this;
        deletedRecordIds.forEach(function(recordId, index) {
            that._currentMethodInstance = new Delete(
                that._table.getName(), recordId, that._language
            );
            // For more information on replaceRange, refer to
            //  CodeMirror's documentation online
            that._currCodeMirror.replaceRange(
                that._currentMethodInstance.outputAsString(),
                CodeMirror.Pos(that._currCodeMirror.lastLine())
            );
            that._currCodeMirror.refresh();
        });
    },

    _handleRowBeginEdit: function(recordId){
        var that = this;
        // Case when row was just created and edits should be 
        //  inputted into the 'create' API call skeleton
        if (this._rowCreated) {
            this._rowCreated = false;
            this._table.bindToCellValueChange(function(recordId, columnId) {
                if (that._isLanguageInitialized) { 
                    that._inNewRowCellChanges(recordId, columnId); 
                }
            });
        } else {
            this._table.bindToCellValueChange(function(recordId, columnId) {
                if (that._isLanguageInitialized) { 
                    that._inRowCellChanges(recordId, columnId); 
                }
            });
        }
    },
    _handleRowEndEdit: function(recordId) { 
        this._table.unbindFromCellValueChange();
    },

    _handleExpandedRowBeginEdit: function(recordId) {
        var that = this;
        console.log(this._table);
        this._table.bindToCellValueChange(function(recordId, columnId) {
            if (that._isLanguageInitialized) {
                that._inExpandedViewCellChanges(recordId, columnId); 
            }
        });
        $(this._DIALOG_TAG).append(this._apiConsole);
        this._addOptionsListeners();
    },

    _addOptionsListeners: function() {
        var that = this;
        this._options.on('change', function() {
            that._language = $(this).val();
            that._isLanguageInitialized = false;
            if (that._language === 'javascript') {
                that._determineWhichConsolesToShow(0);
                that._currCodeMirror = that._codeMirrorInstances[0];
            } else if (that._language === 'python') {
                that._determineWhichConsolesToShow(1);
                that._currCodeMirror = that._codeMirrorInstances[1];
            } else if (that._language === 'ruby') {
                that._determineWhichConsolesToShow(2);
                that._currCodeMirror = that._codeMirrorInstances[2];
            } else {
                that._determineWhichConsolesToShow();
                that._currCodeMirror = null;
            }
            if (that._currCodeMirror) {
                that._currCodeMirror.refresh();
                that._isLanguageInitialized = true;
            }
        });
    },

    _determineWhichConsolesToShow: function(indexToShow) {
        var that = this;
        this._codeMirrorInstances.forEach(function(cm, index) {
            if (indexToShow === index) {
                $(cm.getWrapperElement()).show();
                cm.refresh();
            } else {
                $(cm.getWrapperElement()).hide();
            }
        });
    },    

    _handleExpandedRowEndEdit: function(recordId) {
        // Clean away all the unnecessary previous API consoles
        $('.api-console').remove();
        this._table.unbindFromCellValueChange();
    },

    // Call back functions:
    _inNewRowCellChanges: function(recordId, columnId) {
        var columns = this._table.getCellValuesByColumnId(recordId);
        if (this._currentRecord !== recordId) {
            this._currentMethodInstance = new Create(
                this._table.getName(), this._language,
                this._currCodeMirror.lastLine()
            );
            this._currCodeMirror.replaceRange(
                this._currentMethodInstance.outputAsString(),
                CodeMirror.Pos(this._currCodeMirror.lastLine())
            );
            this._currCodeMirror.refresh();
            this._currentRecord = recordId;            
        }
        this._currentMethodInstance.updateParameters(this._currCodeMirror, columns, 
            columnId, this._table.getColumnById(columnId));
    },
    // Behavior should be the same as that of an expanded view change; 
    //  thus inRowCellChanges simply serves as a descriptive wrapper
    _inRowCellChanges: function(recordId, columnId) {
        this._inExpandedViewCellChanges(recordId, columnId);
    },
    _inExpandedViewCellChanges: function(recordId, columnId) {
        var columns = this._table.getCellValuesByColumnId(recordId);
        if (this._currCodeMirror) { this._currCodeMirror.refresh(); }
        if (this._currentRecord !== recordId) { // changed the record (i.e. different expanded record)
            this._currentMethodInstance = new Update(
                this._table.getName(), recordId, this._language,
                this._currCodeMirror.lastLine()
            );
            this._currCodeMirror.replaceRange(
                this._currentMethodInstance.outputAsString(),
                CodeMirror.Pos(this._currCodeMirror.lastLine())
            );
            this._currCodeMirror.refresh();
            this._currentRecord = recordId;
        }
        this._currentMethodInstance.updateParameters(this._currCodeMirror, columns, 
            columnId, this._table.getColumnById(columnId));
    }
});

module.exports = Console;
