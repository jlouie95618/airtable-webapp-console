'use strict';

var GenericMethod = require('./generic_method.js');

var Update = GenericMethod.extend({
    init: function(tableName, recordId) {
        this._super(tableName, recordId);
        this._container.append($('<div/>').append('base("' + tableName + 
            '").update(' + recordId + ', {'));
        this._container.append(this._updateValue);
        this._container.append($('<div/>').append('});'));
    }
});

module.exports = Update;