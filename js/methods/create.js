'use strict';

var GenericMethod = require('./generic_method.js');

var Create = GenericMethod.extend({
    init: function(tableName, language) {
        this._super(tableName, null, language);
        this._container.append($('<div/>').append('base("' + tableName + 
            '").create({'));
        this._container.append(this._updateValue);
        this._container.append($('<div/>').append('});'));
    }
});

module.exports = Create;
