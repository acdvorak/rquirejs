var fs = require('fs')
  , readdirp = require('readdirp')
  , File = require('../lib/file')
;

/**
 * Contains information about a file.
 * @typedef {Object} FileInfo
 * @property {String}  parentDir     directory in which entry was found (relative to given root)
 * @property {String}  fullParentDir full path to parent directory
 * @property {String}  name          name of the file/directory
 * @property {String}  path          path to the file/directory (relative to given root)
 * @property {String}  fullPath      full path to the file/directory found
 * @property {fs.stat} stat          built in stat object
 */

/**
 * @param {String}   srcRootAbs        Absolute path of the source root directory.
 * @param {String[]} [srcFilePathsRel] Array of .js file paths relative to the source root.
 * @class
 * @constructor
 */
var DepTree = function(srcRootAbs, srcFilePathsRel) {
    srcFilePathsRel = srcFilePathsRel || [];

    /** @type {String} */
    this.srcRootAbs = srcRootAbs;

    /** @type {File[]} */
    this._initialSrcFiles = srcFilePathsRel.map(function(filePathRel) { return new File(srcRootAbs, filePathRel); });

    /** @type {File[]} */
    this._allSrcFiles = [];

    /** @type {Object} */
    this._srcFileMap = {};

    /** @type {File[]} */
    this.dependencies = [];
};

DepTree.prototype = {

    scan: function(done) {
        var opts = {
            root: this.srcRootAbs,
            fileFilter: '*.js'
        };

        var entryStream = readdirp(opts);

        entryStream
            .on('data',  this._onData.bind(this))
            .on('warn',  this._onWarn.bind(this))
            .on('error', this._onError.bind(this))
            .on('end',   this._onEnd.bind(this))
            .on('close', this._onClose.bind(this))
        ;

        entryStream
            .on('end',   function() { return done && done(); })
            .on('close', function() { return done && done(); })
        ;
    },

    /**
     * Invoked whenever a file is found.
     * @param {FileInfo} fileInfo
     * @private
     */
    _onData: function(fileInfo) {
        var file = new File(this.srcRootAbs, fileInfo.path);
        this._allSrcFiles.push(file);
        this._srcFileMap[file.pathRel] = file;
    },

    /**
     * Passes a non-fatal Error that prevents a file/directory from being processed (i.e., if it is inaccessible
     * to the user).
     * @param {Error} err
     * @private
     */
    _onWarn: function(err) {
        console.warn('warning: ', err);
    },

    /**
     * Passes a fatal Error which also ends the stream (i.e., when illegal options where passed).
     * @param {Error} err
     * @private
     */
    _onError: function(err) {
        console.error('error: ', err);
    },

    /**
     * Called when all entries were found and no more will be emitted (i.e., we are done).
     * @private
     */
    _onEnd: function() {
        this._buildTree();
    },

    /**
     * Called when the stream is destroyed via stream.destroy() (which could be useful if you want to manually abort
     * even on a non fatal error) - at that point the stream is no longer readable and no more entries, warning or
     * errors are emitted.
     * @private
     */
    _onClose: function() {
        console.warn('close');
    },

    _buildTree: function() {
        var self = this

            /**
             * Map of relative file paths to their corresponding {@link File} objects.
             * @type {Object}
             */
          , depFileMap = {}
        ;

        this._initialSrcFiles.forEach(function(file) {
            self._buildTreeImpl(depFileMap, file);
        });

        for (var pathRel in depFileMap) {
            this.dependencies.push(depFileMap[pathRel]);
        }
    },

    _buildTreeImpl: function(depFileMap, file) {
        // Dependency has already been scanned and parsed.
        if (depFileMap[file.pathRel]) {
            return;
        }

        depFileMap[file.pathRel] = file;

        var self = this;
        var depFiles = file.directDependencies.map(function(pathRel) {
            return self._srcFileMap[pathRel];
        });

        // Visit each dependency to get _its_ dependencies.
        depFiles.forEach(function(depFile) {
            self._buildTreeImpl(depFileMap, depFile);
        });
    }

};

module.exports = DepTree;
