var Compiler = require('./compiler/compiler.js');

module.exports = {
    compile: function(config) {
        new Compiler(config).compile();
    }
};
