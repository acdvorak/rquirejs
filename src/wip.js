(function(root) {

    var _modules = {
        'path/to/js/module_without_extension': function() { return module; }
    };

    var _pathMap = {
        'shortName': 'long/path/to/file_without_extension'
    };

    var require = function(path) {
        path = _pathMap[path] || path;
        return _modules[path]();
    };

    var define = function(path, fn) {

        _modules[path] = (function() {
            // Hide globals
            var root,
                _modules,
                _pathMap,
                x;

            var module;

            // Memo
            return function() {
                if (module) {
                    return module.exports;
                }

                module = {
                    exports: {}
                };

                fn(module, module.exports);

                return module.exports;
            };

        }());

    };

    define('utils', function(module, exports) {

        /*! Module source code goes here */
        var _private = 1;
        module.exports = {
            alert: function() {
                window.alert.apply(null, arguments);
            }
        };

    });

    define('modules/inc', function(module, exports) {

        var _utils = require('utils');

        /*! Module source code goes here */
        var _private = 1;
        module.exports = {
            increment: function() {
                return _private++;
            }
        };

    });

    // Expose an external API
    root.increment = function() {
        require('utils').alert(require('modules/inc').increment());
    };

}(window));
