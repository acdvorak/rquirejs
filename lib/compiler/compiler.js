var _ = require('underscore')
  , fs = require('fs')
  , path = require('path')
  , mkdirp = require('mkdirp')
  , File = require('./file')
  , DepTree = require('./deptree')
;

var rLeadingSlash = /^\//
  , rJSExt = /\.js$/
  , rLineComment  = new RegExp('[ \\t]*//.*', 'g')
  , rTrailingWhitespace  = /\s+$/g
;

var _utils = {
    readFileSyncRel: function(pathRelativeToThisFile) {
        return fs.readFileSync(path.resolve(__dirname, pathRelativeToThisFile), { encoding: 'utf8' });
    },

    indent: function(str) {
        var indent = '    ';
        return indent + str.replace(/\r\n/g, '\n').split('\n').join('\n' + indent);
    },

    normalizePath: function(path) {
        var norm = path;
        norm = norm.replace(rLeadingSlash, '');
        norm = rJSExt.test(norm) ? norm : (norm + '.js');
        return norm;
    },

    resolveModule: function(modulesDir, moduleName) {
        var modulesDirNorm = modulesDir;
        modulesDirNorm = (modulesDirNorm[modulesDirNorm.length - 1] === '/') ? modulesDirNorm : (modulesDirNorm + '/');
        return _utils.normalizePath(modulesDirNorm + moduleName);
    },

    resolveModules: function(modulesDir, moduleNames) {
        var utils = this;
        return moduleNames.map(function(moduleName) {
            return utils.resolveModule(modulesDir, moduleName);
        });
    },

    resolveAliases: function(aliases) {
        return _
            .values(aliases)
            .filter(function(value) {
                return rLeadingSlash.test(value) || rJSExt.test(value);
            })
            .map(function(pathDirty) {
                var pathRel = pathDirty;
                pathRel = pathRel.replace(rLeadingSlash, '');
                pathRel = rJSExt.test(pathRel) ? pathRel : (pathRel + '.js');
                return pathRel;
            })
        ;
    },

    validateConfig: function(config, propNames) {
        propNames.forEach(function(propName) {
            if (!config[propName]) {
                throw new Error('Required config property "' + propName + '" not found');
            }
        });
    },

    replace: function(source, find, replacement) {
        var regex = new RegExp('[ \\t]*(?:/\\*!?)?__' + find + '__(?:!?\\*/)?[ \\t]*', 'g');

        // To avoid special character issues in RegExp replacement strings,
        // use a function to provide the replacement.
        // See https://github.com/slevithan/xregexp/issues/65
        return source.replace(regex, function() { return replacement; });
    },

    stripLineComments: function(source) {
        return source.replace(rLineComment, '');
    },

    stripTrailingSpaces: function(source) {
        return source
            .split('\n')
            .map(function(line) { return line.replace(rTrailingWhitespace, ''); })
            .join('\n')
        ;
    }
};

var Compiler = function(config) {
    _utils.validateConfig(config, [ 'src_root', 'main', 'dest' ]);

    this.config = config;

    config.user_modules = config.user_modules || [];
    config.aliases = config.aliases || {};
    config.globals = config.globals || {};

    var srcRootAbs = config.src_root,
        main = _utils.normalizePath(config.main),
        userModules = _utils.resolveModules(config.modules_dir, config.user_modules),
        aliasModules = _utils.resolveAliases(config.aliases),
        srcFilePathsRel = [].concat(main, userModules, aliasModules);

    srcFilePathsRel = _.uniq(srcFilePathsRel);

    this.depTree = new DepTree(srcRootAbs, srcFilePathsRel, config.micro_paths);
};

Compiler.prototype = {

    compile: function(done) {
        var complete = this._onScanComplete.bind(this);
        this.depTree.scan(function() {
            complete();
            done && done();
        });
    },

    _addUniversal: function(runtime, universalName) {
        var intro = universalName ? _utils.readFileSyncRel('../runtime/universal-intro.tpl.js') : '',
            outro = universalName ? _utils.readFileSyncRel('../runtime/universal-outro.tpl.js') : '';

        intro = _utils.replace(intro, 'UNIVERSAL_MODULE_NAME', universalName);
        outro = _utils.replace(outro, 'UNIVERSAL_MODULE_NAME', universalName);

        runtime = _utils.replace(runtime, 'UNIVERSAL_MODULE_INTRO', intro);
        runtime = _utils.replace(runtime, 'UNIVERSAL_MODULE_OUTRO', outro);

        return runtime;
    },

    _addGlobals: function(runtime) {
        var names = _.keys(this.config.globals),
            values = _.values(this.config.globals);

        if (this.config.safe_undefined === true) {
            names.push('undefined');
        }

        var retVal = runtime
          , intro = ''
          , outro = ''
        ;

        if (names.length) {
            retVal = _utils.indent(retVal);
            intro = '(function(' + names.join(', ') + ') {';
            outro = '}(' + values.join(', ') + '));';
        }

        retVal = _utils.replace(retVal, 'GLOBAL_NAMES',  intro);
        retVal = _utils.replace(retVal, 'GLOBAL_VALUES', outro);

        return retVal;
    },

    _onScanComplete: function() {
        var moduleTpl = _utils.readFileSyncRel('../runtime/module.tpl.js')
          , runtimeTpl = _utils.readFileSyncRel('../runtime/runtime.tpl.js')
        ;
        var moduleDefs = this.depTree.dependencies.map(
            /**
             * @param {File} file
             * @returns {String}
             */
            function(file) {
                var def = moduleTpl;
                def = _utils.replace(def, 'PATH', file.pathCanonical);
                def = _utils.replace(def, 'SOURCE', _utils.indent(file.canonicalSource.trim()));
                def = def.trim();
                return def;
            }
        );

        var aliases = {};
        for (var alias in this.config.aliases) {
            var pathRel = this.config.aliases[alias];
            aliases[alias] = File.canonicalizePath(pathRel, this.config.micro_paths);
        }

        var config = {
            main: File.canonicalizePath('/' + _utils.normalizePath(this.config.main), this.config.micro_paths),
            aliases: aliases
        };

        var configArg = JSON.stringify(config, null, 4);
        var moduleDefsArg = '{\n' + _utils.indent(moduleDefs.join(',\n')) + '\n}';

        var runtime = runtimeTpl;
        runtime = _utils.stripLineComments(runtime);
        runtime = _utils.replace(runtime, 'CONFIG', _utils.indent(configArg));
        runtime = _utils.replace(runtime, 'MODULE_DEFINITIONS', _utils.indent(moduleDefsArg));
        runtime = this._addUniversal(runtime, this.config.universal);
        runtime = this._addGlobals(runtime);
        runtime = _utils.stripTrailingSpaces(runtime);

        mkdirp.sync(path.dirname(this.config.dest));
        fs.writeFileSync(this.config.dest, runtime);
    }

};

module.exports = Compiler;
