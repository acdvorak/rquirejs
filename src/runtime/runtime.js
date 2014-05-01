(function(config, definitions) {

    (function(root, win, doc) {

        var _modules = {
//            '/path/to/module.js': function() { return module; },
            'root': function() { return root; },
            'window': function() { return win; },
            'document': function() { return doc; }
        };

        var _pathMap = {
//            'shortName': '/long/path/to/file.js'
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

}(/*__CONFIG__*/));
