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
                    var actualName = config.globals[exposedName];
                    if (actualName[0] === '!') {
                        var expr = actualName.substr(1);
                        args.push(eval(expr));
                    } else {
                        args.push(root[actualName]);
                    }
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
