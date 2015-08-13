'use strict';

var GenericMethod = require('./generic_method.js');

var Delete = GenericMethod.extend({
    init: function(tableName, recordId) {
        this._super(tableName, recordId);
        this._container.append($('<div/>').append('base("' + tableName + 
            '").delete(' + recordId + ');'));
    }
});

module.exports = Delete;
