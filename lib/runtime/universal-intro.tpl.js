(function(name, definition) {

    if (typeof define === 'function') { // AMD
        define(function() { return definition; });
    } else if (typeof module !== 'undefined' && module.exports) { // Node.js
        module.exports = definition;
    } else { // Browser
        this[name] = definition;
    }

})('/*!__UNIVERSAL_MODULE_NAME__!*/',
