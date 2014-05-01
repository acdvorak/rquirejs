var fs = require('fs')
  , path = require('path')
  , DepTree = require('./deptree')
;

var rJSExt = /\.js$/;

var _utils = {
    readFileSyncRel: function(pathRelativeToThisFile) {
        return fs.readFileSync(path.resolve(__dirname, pathRelativeToThisFile), { encoding: 'utf8' });
    },

    indent: function(str) {
        var indent = '    ';
        return indent + str.split('\n').join('\n' + indent);
    },

    normalizePath: function(path) {
        var norm = path;
        norm = norm.replace(/^\//, '');
        norm = rJSExt.test(norm) ? norm : (norm + '.js');
        return norm;
    },

    resolveModule: function(moduleDir, moduleName) {
        var moduleDirNorm = moduleDir;
        moduleDirNorm = (moduleDirNorm[moduleDirNorm.length - 1] === '/') ? moduleDirNorm : (moduleDirNorm + '/');
        return _utils.normalizePath(moduleDirNorm + moduleName);
    },

    validateConfig: function(config, propNames) {
        propNames.forEach(function(propName) {
            if (!config[propName]) {
                throw new Error('Required config property "' + propName + '" not found');
            }
        });
    }
};

var Compiler = function(config) {
    _utils.validateConfig(config, [ 'src_root', 'main', 'dest' ]);

    this.config = config;

    config.base_modules = config.base_modules || [];
    config.aliases = config.aliases || {};

    var srcRoot = config.src_root,
        main = _utils.normalizePath(config.main),
        baseModules = config.base_modules.map(function(moduleName) {
            return _utils.resolveModule(config.modules_dir, moduleName);
        }),
        allModules = [ main ].concat(baseModules);

    this.depTree = new DepTree(srcRoot, allModules);
};

Compiler.prototype = {

    compile: function() {
        this.depTree.scan(this._onScanComplete.bind(this));
    },

    _onScanComplete: function() {
        var moduleTpl = _utils.readFileSyncRel('../runtime/module-definition.tpl.js')
          , runtimeTpl = _utils.readFileSyncRel('../runtime/runtime.js')
        ;
        var moduleDefs = this.depTree.dependencies.map(
            /**
             * @param {File} file
             * @returns {String}
             */
            function(file) {
                return moduleTpl
                    .replace(/__PATH__/g, file.pathCanonical)
                    .replace(/__SOURCE__/g, _utils.indent(file.canonicalSource.trim()))
                    .trim()
                ;
            }
        );

        var config = {
            main: '/' + _utils.normalizePath(this.config.main),
            aliases: this.config.aliases
        };

        var configArg = JSON.stringify(config);
        var moduleDefsArg = '{\n' + _utils.indent(moduleDefs.join(',\n')) + '\n}';

        var args = [ configArg, moduleDefsArg ].join(',\n');

        var runtime = runtimeTpl.replace(/(?:\/\*!?)?__CONFIG__(?:!?\*\/)?/g, '\n' + _utils.indent(args) + '\n');

        fs.writeFileSync(this.config.dest, runtime);
    }

};

module.exports = Compiler;
