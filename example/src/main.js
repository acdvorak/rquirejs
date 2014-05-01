var root = require('root')
  , document = require('document')
  , array = require('ai')
;

var _utils = require('./util'),
    _counter = require('./modules/counter');

module.exports = {
    run: function() {
        document.onclick = function() {
            _utils.alert(
                _counter.increment() + '\n' +
                _.all([ 1, 2, 3 ], function(val) { return val > 0; }) + '\n' +
                $('body').hasClass('blah')
            );
        };
    }
};

root.start = function() {
    module.exports.run();
};
