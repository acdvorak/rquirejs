(function(config, definitions) {

    (function(root, win, doc) {

        var _modules = {
            'root': function() { return root; },
            'window': function() { return win; },
            'document': function() { return doc; },
            'path/to/js/module_without_extension': function() { return module; }
        };

        var _pathMap = {
            'shortName': 'long/path/to/file_without_extension'
        };

        var rjsExt = /\.js$/;
        var _normalize = function(path) {
            return path && rjsExt.test(path) ? path.replace(rjsExt, '') : path;
        };

        var require = function(path) {
            path = _normalize(path);
            path = _pathMap[path] || path;
            path = _normalize(path);
            return _modules[path]();
        };

        var _define = function(path, def) {
            path = _normalize(path);
            _modules[path] = (function() {
                var module;

                // Memo
                return function() {
                    if (module) {
                        return module.exports;
                    }
                    module = { exports: {} };
                    def(require, module, module.exports);
                    return module.exports;
                };
            }());
        };

        for (var path in definitions) {
            _define(path, definitions[path]);
        }

        require(config.main || 'main');

    }(window, window, document));

}(
    {
        main: 'main'
    },
    {
        'util': function(require, module, exports) {
            /*! Module source code goes here */

            var window = require('window');

            module.exports = {
                alert: function() {
                    window.alert.apply(null, arguments);
                }
            };
        },
        'modules/counter': function(require, module, exports) {
            /*! Module source code goes here */
            var _private = 1;
            module.exports = {
                increment: function() {
                    return _private++;
                }
            };
        },
        'main': function(require, module, exports) {
            /*! Module source code goes here */

            var root = require('root')
              , document = require('document')
              , _utils = require('util')
              , _counter = require('modules/counter')
            ;

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
        }
    }
));
