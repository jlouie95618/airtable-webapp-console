'use strict';

var GenericMethod = require('./generic_method.js');

var Delete = GenericMethod.extend({
    init: function(tableName, recordId, language) {
        this._super(tableName, recordId, language, null);
        this._result += 'base("' + tableName + '").delete(\'' + recordId + '\');\n';
        // this._currLineNum = null;
        // this._lastLineNum = null;    
    }
});

module.exports = Delete;
