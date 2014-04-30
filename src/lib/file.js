var fs = require('fs')
  , path = require('path')
;

var rRequireSingleQuote = /require\s*\(\s*'([^']+?)'\s*\)/g
  , rRequireDoubleQuote = /require\s*\(\s*"([^"]+?)"\s*\)/g
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
    this._directDependencies = null;
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

    _getDirectDependencies: function() {
        var self = this
          , stripped = this.strippedFileContents
          , single   = (stripped.match(rRequireSingleQuote) || []).map(function(str) { return rRequireSingleQuote.exec(str); })
          , double   = (stripped.match(rRequireDoubleQuote) || []).map(function(str) { return rRequireDoubleQuote.exec(str); })
          , matches  = [].concat(single).concat(double)
        ;
        return matches.map(function(match) {
            var depPathRelToSelf = rJSExt.test(match[1]) ? match[1] : match[1] + '.js'
              , depPathAbs = path.resolve(self.parentAbs, depPathRelToSelf)
              , depPathRelToRoot = path.relative(self.srcRoot, depPathAbs)
            ;
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

    directDependencies: {
        get: function() {
            return this._directDependencies || (this._directDependencies = this._getDirectDependencies());
        }
    }

});

module.exports = File;
