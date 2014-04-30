var Set = function() {
    if (!(this instanceof Set)) { return new Set(); }
    this._map = {};
};

Set.prototype = {

    add: function(key) {
        this._map[key] = 1;
        return this;
    },

    has: function(key) {
        return this._map[key] === 1;
    },

    'delete': function(key) {
        var ret = this.has(key);
        delete this._map[key];
        return ret;
    },

    clear: function() {
        this._map = {};
        return this;
    }

};

Object.defineProperties(Set.prototype, {

    size: {
        get: function() {
            return Object.keys(this._map).length;
        }
    },

    entries: {
        get: function() {
            return Object.keys(this._map);
        }
    }

});

module.exports = Set;
