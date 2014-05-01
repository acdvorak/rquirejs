(function(config, definitions) {

    (function(root, win, doc) {

        var _modules = {
//            '/path/to/module.js': function() { return module; },
            'root': function() { return root; },
            'window': function() { return win; },
            'document': function() { return doc; }
        };

        var _aliases = {
//            'shortName': '/long/path/to/file.js'
        };

        for (var alias in config.aliases) {
            _aliases[alias] = config.aliases[alias];
        }

        var require = function(path) {
            path = _aliases[path] || path;
            return _modules[path]();
        };

        var _define = function(path, definition) {
            var module;

            _modules[path] = function() {
                if (module) {
                    return module.exports;
                }

                module = { exports: {} };

                var args = [ require, module, module.exports ];

                for (var exposedName in config.globals) {
                    var names = config.globals[exposedName].split(/\s*\|\|\s*/g)
                      , len = names.length
                      , idx = 0;

                    var finalVal;

                    for (; idx < len; idx++) {
                        var val = root[names[idx]];
                        if (val) {
                            finalVal = val;
                            break;
                        }
                    }

                    args.push(finalVal);
                    finalVal = undefined;
                }

                definition.apply(null, args);

                return module.exports;
            };
        };

        for (var path in definitions) {
            _define(path, definitions[path]);
        }

        require(config.main);

    }(window, window, document));

}(/*__CONFIG__*/));
