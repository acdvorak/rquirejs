var Compiler = require('./src/compiler/compiler.js');

var compiler = new Compiler({
    "src_root": "example/src/",
    "main": "main.js",
    "modules_dir": "modules/",
    "user_modules": [
//        "array",
//        "counter"
    ],
    "aliases": {
        "root": "/common/window.js",
        "window": "/common/window.js",
        "document": "/common/document.js",

        "ai": "/modules/array-internal.js"
    },
    "globals": {
//        "undefined": "'hello'",
        "_": "_",
        "$": "window.Zepto || window.jQuery"
    },
    "safe_undefined": true,
    "dest": "example/dist/example.js"
});

compiler.compile();
