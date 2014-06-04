/*!__GLOBAL_NAMES__!*/
/*!__UNIVERSAL_MODULE_INTRO__!*/
(function(config, definitions, undefined) {

    var modules = {
//        '/path/to/module.js': function() { return module; },
    };

    var moduleCache = {
//        '/path/to/module.js': module,
    };

    var aliases = {
//        'shortName': '/long/path/to/file.js'
    };

    for (var alias in config.aliases) {
        aliases[alias] = config.aliases[alias];
    }

    var require = function(path) {
        path = aliases[path] || path;
        return moduleCache[path] || (moduleCache[path] = modules[path]());
    };

    var define = function(path, definition) {
        var module;

        modules[path] = function() {
            if (module) {
                return module.exports;
            }
            module = { exports: {} };
            definition(require, module, module.exports);
            return module.exports;
        };
    };

    for (var path in definitions) {
        define(path, definitions[path]);
    }

    return require(config.main);

}(
    /*!__CONFIG__!*/,
    /*!__MODULE_DEFINITIONS__!*/
))
/*!__UNIVERSAL_MODULE_OUTRO__!*/
;
/*!__GLOBAL_VALUES__!*/
