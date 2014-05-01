var DepTree = require('./deptree');

var rJSExt = /\.js$/;

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

    config.required_modules = config.required_modules || [];

    var srcRoot = config.src_root,
        main = _normalizePath(config.main),
        reqModules = config.required_modules.map(function(moduleName) { return _normalizeModulePath(config.module_dir, moduleName); });

    var self = this;

    this.depTree = new DepTree(srcRoot, [ main ].concat(reqModules));
    this.depTree.scan(function() {
        console.log(self.depTree.depFiles.map(function(file) {
            console.log(file.pathNorm + ':\n');
            console.log('    ' + file.fileContentsPathNormalized.split('\n').join('\n    '));
            return file.pathNorm;
        }));
    });
};

Compiler.prototype = {

};

module.exports = Compiler;
