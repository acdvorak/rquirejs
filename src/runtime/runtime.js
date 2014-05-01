(function(config, definitions) {

    (function(root, win, doc) {

        var _modules = {
            'root': function() { return root; },
            'window': function() { return win; },
            'document': function() { return doc; },
            '/path/to/module.js': function() { return module; }
        };

        var _pathMap = {
            'shortName': '/long/path/to/file.js'
        };

        var require = function(path) {
            path = _pathMap[path] || path;
            return _modules[path]();
        };

        var _define = function(path, def) {
            var module;

            _modules[path] = function() {
                if (module) {
                    return module.exports;
                }
                module = { exports: {} };
                def(require, module, module.exports);
                return module.exports;
            };
        };

        for (var path in definitions) {
            _define(path, definitions[path]);
        }

        require(config.main);

    }(window, window, document));

}(
    /*!__CONFIG_START__!*/
    {
        main: '/main.js'
    },
    {
        '/util.js': function(require, module, exports) {
            // Module source code goes here
            var window = require('window');
            module.exports = {
                alert: function() {
                    window.alert.apply(null, arguments);
                }
            };
        },
        '/modules/counter.js': function(require, module, exports) {
            // Module source code goes here
            var _private = 1;
            module.exports = {
                increment: function() {
                    return _private++;
                }
            };
        },
        '/main.js': function(require, module, exports) {
            // Module source code goes here
            var root = require('root')
              , document = require('document')
              , _utils = require('/util.js')
              , _counter = require('/modules/counter.js')
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
    /*!__CONFIG_END__!*/
));
