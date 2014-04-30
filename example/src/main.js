var root = require('root')
  , document = require('document')
  , array = require('./modules/array-internal')
;

var _utils = require('./util'),
    _counter = require('./modules/counter');

module.exports = {
    run: function() {
        document.onclick = function() {
            _utils.alert(_counter.increment());
        };
    }
};

root.start = function() {
    module.exports.run();
};
