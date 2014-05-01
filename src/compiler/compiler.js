var fs = require('fs')
  , path = require('path')
;

var DepTree = require('./deptree');

var rJSExt = /\.js$/;

var _readFileSyncRel = function(pathRelativeToThisFile) {
    return fs.readFileSync(path.resolve(__dirname, pathRelativeToThisFile), { encoding: 'utf8' });
};

var _indent = function(str) {
    var indent = '    ';
    return indent + str.split('\n').join('\n' + indent);
};

var _normalizePath = function(path) {
    var norm = path;
    norm = norm.replace(/^\//, '');
    norm = rJSExt.test(norm) ? norm : (norm + '.js');
    return norm;
};

var _normalizeModulePath = function(moduleDir, moduleName) {
    var moduleDirNorm = moduleDir;
    moduleDirNorm = (moduleDirNorm[moduleDirNorm.length - 1] === '/') ? moduleDirNorm : (moduleDirNorm + '/');
    return _normalizePath(moduleDirNorm + moduleName);
};

var Compiler = function(config) {
    if (!config.main) { throw new Error('"main" is a required config field'); }
    if (!config.module_dir) { throw new Error('"module_dir" is a required config field'); }

    this.config = config;

    config.required_modules = config.required_modules || [];

    var srcRoot = config.src_root,
        main = _normalizePath(config.main),
        reqModules = config.required_modules.map(function(moduleName) { return _normalizeModulePath(config.module_dir, moduleName); });

    this.depTree = new DepTree(srcRoot, [ main ].concat(reqModules));
};

Compiler.prototype = {

    compile: function() {
        this.depTree.scan(this._onScanComplete.bind(this));
    },

    _onScanComplete: function() {
        var moduleTpl = _readFileSyncRel('../runtime/module-definition.tpl.js')
          , runtimeTpl = _readFileSyncRel('../runtime/runtime.js')
        ;
        var moduleDefs = this.depTree.depFiles.map(
            /**
             * @param {File} file
             * @returns {String}
             */
            function(file) {
                return moduleTpl
                    .replace(/__PATH__/g, file.pathNorm)
                    .replace(/__SOURCE__/g, _indent(file.fileContentsPathNormalized.trim()))
                    .trim()
                ;
            }
        );

        var configArg = JSON.stringify({ main: '/' + _normalizePath(this.config.main) });
        var moduleDefsArg = '{\n' + _indent(moduleDefs.join(',\n')) + '\n}';

        var args = [ configArg, moduleDefsArg ].join(',\n');

        var runtime = runtimeTpl;
        runtime = runtime.replace(/\s*\/\*!__CONFIG_START__!\*\/[\s\S]*\/\*!__CONFIG_END__!\*\/\s*/, '__CONFIG__');
        runtime = runtime.replace(/__CONFIG__/g, '\n' + _indent(args) + '\n');

        fs.writeFileSync(this.config.dest, runtime);
    }

};

module.exports = Compiler;
