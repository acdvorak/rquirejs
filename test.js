var Compiler = require('./src/compiler/compiler.js');

var compiler = new Compiler({
    "src_root": "/Users/acdvorak/dev/libs/rquirejs/example/src",
    "main": "main.js",
    "modules_dir": "modules/",
    "base_modules": [
//        "array",
//        "counter"
    ],
    "dest": "/Users/acdvorak/dev/libs/rquirejs/example/dist/example.js"
});

compiler.compile();
