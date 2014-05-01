var Compiler = require('./src/compiler/compiler.js');

var compiler = new Compiler({
    "src_root": "example/src/",
    "main": "main.js",
    "modules_dir": "modules/",
    "base_modules": [
//        "array",
//        "counter"
    ],
    "aliases": {
        "ai": "/modules/array-internal.js"
    },
    "globals": {
        "_": "_",
        "$": "Zepto || jQueryX"
    },
    "dest": "example/dist/example.js"
});

compiler.compile();
