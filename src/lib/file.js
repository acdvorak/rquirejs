var fs = require('fs')
  , path = require('path')
;

var rRequireSingleQuote = /require\s*\(\s*'(\.[^']+?)'\s*\)/g
  , rRequireDoubleQuote = /require\s*\(\s*"(\.[^"]+?)"\s*\)/g
;

var rBlockComment = new RegExp('/\\*[\\s\\S]*?\\*/', 'g')
  , rLineComment = new RegExp('//.*', 'g')
;

var rJSExt = /\.js$/;

/**
 * @param {String} srcRoot Absolute path to the source root directory.
 * @param {String} pathRel Path to the JS file relative to the source root.
 * @class
 * @constructor
 */
var File = function(srcRoot, pathRel) {
    this.srcRoot = srcRoot;
    this.pathRel = pathRel;
    this.pathAbs = path.resolve(this.srcRoot, this.pathRel);
    this.parentRel = path.dirname(this.pathRel);
    this.parentAbs = path.dirname(this.pathAbs);

    this._fileContents = null;
    this._strippedFileContents = null;
    this._fileContentsPathNormalized = null;
    this._directDependencies = null;

    this._pathNormMap = {};
};

var _match = function(stripped, regex) {
    return (stripped.match(regex) || [])
        .map(function(str) {
            return new RegExp(regex).exec(str);
        });
};

File.prototype = {

    _getFileContents: function() {
        return fs.readFileSync(this.pathAbs, { encoding: 'utf-8' });
    },

    _getStrippedFileContents: function() {
        var fileContents = this.fileContents;
        return fileContents
            .replace(rBlockComment, '')
            .replace(rLineComment, '')
        ;
    },

    _getFileContentsPathNormalized: function() {
        var fileContents = this.fileContents;
        fileContents = this._normalize(fileContents, rRequireSingleQuote);
        fileContents = this._normalize(fileContents, rRequireDoubleQuote);
        return fileContents;
    },

    _normalize: function(contents, regex) {
        var self = this;
        return contents.replace(regex, function(matchSubstring, badPath, offset, totalString) {
            return matchSubstring.replace(badPath, self._pathNormMap[badPath]);
        });
    },

    _getDirectDependencies: function() {
        var self = this
          , stripped = this.strippedFileContents
          , single   = _match(stripped, rRequireSingleQuote)
          , double   = _match(stripped, rRequireDoubleQuote)
          , matches  = [].concat(single).concat(double)
        ;
        return matches.map(function(match) {
            var depPathRelToSelf = rJSExt.test(match[1]) ? match[1] : match[1] + '.js'
              , depPathAbs = path.resolve(self.parentAbs, depPathRelToSelf)
              , depPathRelToRoot = path.relative(self.srcRoot, depPathAbs)
            ;
            self._pathNormMap[match[1]] = '/' + depPathRelToRoot;
            return depPathRelToRoot;
        });
    },

    toString: function() {
        return this.pathRel;
    }

};

Object.defineProperties(File.prototype, {

    fileContents: {
        get: function() {
            return this._fileContents || (this._fileContents = this._getFileContents());
        }
    },

    strippedFileContents: {
        get: function() {
            return this._strippedFileContents || (this._strippedFileContents = this._getStrippedFileContents());
        }
    },

    fileContentsPathNormalized: {
        get: function() {
            return this._fileContentsPathNormalized || (this._fileContentsPathNormalized = this._getFileContentsPathNormalized());
        }
    },

    directDependencies: {
        get: function() {
            return this._directDependencies || (this._directDependencies = this._getDirectDependencies());
        }
    }

});

module.exports = File;
