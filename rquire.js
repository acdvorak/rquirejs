var Compiler = require('./lib/compiler/compiler.js');

module.exports = {
    compile: function(config) {
        new Compiler(config).compile();
    }
};
