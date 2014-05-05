var fs = require('fs')
  , path = require('path')
;

var rRequireSingleQuote = /require\s*\(\s*'(\.[^']+?)'\s*\)/g
  , rRequireDoubleQuote = /require\s*\(\s*"(\.[^"]+?)"\s*\)/g

  , rBlockComment = new RegExp('/\\*[\\s\\S]*?\\*/', 'g')
  , rLineComment  = new RegExp('//.*', 'g')

  , rJSExt = /\.js$/
  , rWinDirSep = /\\/g

    // Start at 1 to avoid falsy '0'
  , _microPathInc = 1
  , _microPathMap = {}
;

var _match = function(stripped, regex) {
    var matches = (stripped.match(regex) || []);
    return matches.map(function(str) {
        return new RegExp(regex).exec(str);
    });
};

/**
 * @param {String}  srcRoot Absolute path to the source root directory.
 * @param {String}  pathRel Path to the JS file relative to the source root (WITHOUT a leading slash!).
 * @param {Boolean} [useMicroPaths] If true, all require() paths in the compiled output file will be replaced with
 *                                  auto-incremented integers to improve minification.
 * @class
 * @constructor
 */
var File = function(srcRoot, pathRel, useMicroPaths) {
    /**
     * Determines whether all require() paths in the compiled output file will be replaced with
     * auto-incremented integers to improve minification.
     * @type {Boolean}
     */
    this.useMicroPaths = useMicroPaths;

    /**
     * Absolute path to the source root directory.
     * @type {String}
     * @example
     * /Users/acdvorak/dev/libs/rquirejs/example/src
     */
    this.srcRoot = srcRoot;

    /**
     * Path to the JS file relative to the source root (WITHOUT a leading slash!).
     * @type {String}
     * @example
     * modules/array.js
     */
    this.pathRel = pathRel;

    /**
     * Absolute path to the JS file.
     * @type {String}
     * @example
     * /Users/acdvorak/dev/libs/rquirejs/example/src/modules/array.js
     */
    this.pathAbs = path.resolve(this.srcRoot, this.pathRel);

    /**
     * Same as {@link #pathRel}, but with a leading slash.
     * @type {String}
     * @example
     * /modules/array.js
     */
    this.pathCanonical = File.canonicalizePath(this.pathRel, useMicroPaths);

    /**
     * Path to the JS file's parent directory relative to the source root (WITHOUT a leading slash!).
     * @type {String}
     * @example
     * modules
     */
    this.parentRel = path.dirname(this.pathRel);

    /**
     * Absolute path to the JS file's parent directory.
     * @type {String}
     * @example
     * /Users/acdvorak/dev/libs/rquirejs/example/src/modules
     */
    this.parentAbs = path.dirname(this.pathAbs);

    /**
     * Determines whether this file is a direct dependency of any other file being compiled.
     * @type {boolean}
     */
    this.isReferenced = false;

    this._rawSource = null;
    this._strippedSource = null;
    this._canonicalSource = null;
    this._directDependencies = null;

    /**
     * Map of raw require() paths to their canonical form.
     * @type {Object}
     * @private
     */
    this._canonicalPathMap = {};
};

File.canonicalizePath = function(pathRel, useMicroPaths) {
    var canon = pathRel;
    canon = canon[0] === '/' ? canon : '/' + canon;
    canon = canon.replace(rWinDirSep, '/');
    canon = rJSExt.test(canon) ? canon : canon + '.js';
    return useMicroPaths ? (_microPathMap[canon] || (_microPathMap[canon] = _microPathInc++)) : canon;
};

File.prototype = {

    _getRawSource: function() {
        return fs.readFileSync(this.pathAbs, { encoding: 'utf8' });
    },

    _getStrippedSource: function() {
        var fileContents = this.rawSource;
        return fileContents
            .replace(rBlockComment, '')
            .replace(rLineComment, '')
        ;
    },

    _getCanonicalSource: function() {
        var fileContents = this.rawSource;
        fileContents = this._normalize(fileContents, rRequireSingleQuote);
        fileContents = this._normalize(fileContents, rRequireDoubleQuote);
        return fileContents;
    },

    _normalize: function(source, regex) {
        var self = this;
        return source.replace(regex, function(matchSubstring, badPath, offset, totalString) {
            return matchSubstring.replace(badPath, self._canonicalPathMap[badPath]);
        });
    },

    _getDirectDependencies: function() {
        var self = this
          , stripped = this.strippedSource
          , single   = _match(stripped, rRequireSingleQuote)
          , double   = _match(stripped, rRequireDoubleQuote)
          , matches  = [].concat(single).concat(double)
        ;
        return matches.map(function(match) {
            var rawPath = match[1]
              , depPathRelToSelf = rJSExt.test(rawPath) ? rawPath : rawPath + '.js'
              , depPathAbs = path.resolve(self.parentAbs, depPathRelToSelf)
              , depPathRelToRoot = path.relative(self.srcRoot, depPathAbs)
            ;
            self._canonicalPathMap[rawPath] = File.canonicalizePath(depPathRelToRoot, self.useMicroPaths);
            return depPathRelToRoot;
        });
    },

    toString: function() {
        return this.pathRel;
    }

};

Object.defineProperties(File.prototype, {

    rawSource: {
        get: function() {
            return this._rawSource || (this._rawSource = this._getRawSource());
        }
    },

    strippedSource: {
        get: function() {
            return this._strippedSource || (this._strippedSource = this._getStrippedSource());
        }
    },

    canonicalSource: {
        get: function() {
            return this._canonicalSource || (this._canonicalSource = this._getCanonicalSource());
        }
    },

    /**
     * Array of relative paths require()'d by this file.
     * @type {String[]}
     */
    directDependencies: {
        get: function() {
            return this._directDependencies || (this._directDependencies = this._getDirectDependencies());
        }
    }

});

module.exports = File;
