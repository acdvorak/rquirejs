(function(config, definitions) {

    (function(root) {

        var _modules = {
            'root': function() { return root; },
            'path/to/js/module_without_extension': function() { return module; }
        };

        var _pathMap = {
            'shortName': 'long/path/to/file_without_extension'
        };

        var _normalize = function(path) {
            return path && /\.js$/.test(path) ? path.replace(/\.js$/, '') : path;
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

        // Expose an external API
        root.start = function() {
            require('main').run();
        };

    }(window));

}(
    {
        src: 'src/',
        main: 'main.js',
        module_dir: 'modules/',
        modules: [
            'array',
            'attr',
            'class',
            'css',
            'data',
            'dimension',
            'event',
            'form'
        ],
        dist: 'dist/'
    },
    {
        'utils': function(require, module, exports) {
            /*! Module source code goes here */
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
            var _utils = require('utils'),
                _counter = require('modules/counter');
            module.exports = {
                run: function() {
                    document.onclick = function() {
                        _utils.alert(_counter.increment());
                    };
                }
            };
        }
    }
));
