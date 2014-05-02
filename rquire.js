var Compiler = require('./lib/compiler/compiler.js');

module.exports = {
    compile: function(config, done) {
        new Compiler(config).compile(done);
    }
};
