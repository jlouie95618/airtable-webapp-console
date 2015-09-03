'use strict';

var GenericMethod = require('./generic_method.js');

var Update = GenericMethod.extend({
    init: function(tableName, recordId, language, prevLastConsoleLineNum) {
        this._super(tableName, recordId, language, prevLastConsoleLineNum);
        this._result += 'base("' + tableName + '").update(\'' + recordId + '\', {\n';
        this._result += this._convertLineObjectToString(this._currLineObject) + '\n';
        this._result += '});\n';
        // This defined where we want to start inserting changes
        //  if we are going to change the current line
        this._currLineNum = prevLastConsoleLineNum + 1;
        //  This defines the lower bound of the method instance's edit range
        this._lastLineNum = prevLastConsoleLineNum + 2;
    }
});

module.exports = Update;