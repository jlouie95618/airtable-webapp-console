'use strict';

var GenericMethod = require('./generic_method.js');

var Delete = GenericMethod.extend({
    init: function(tableName, recordId, language) {
        this._super(tableName, recordId, language);
        this._container.append($('<div/>').append('base("' + tableName + 
            '").delete(' + recordId + ');'));
    }
});

module.exports = Delete;
