var Compiler = require('./src/compiler/compiler.js');

var compiler = new Compiler({
    "src_root": "/Users/acdvorak/dev/libs/rquirejs/example/src",
    "main": "main.js",
    "module_dir": "modules/",
    "required_modules": [
//        "array",
//        "counter"
    ]
});

compiler.compile();
