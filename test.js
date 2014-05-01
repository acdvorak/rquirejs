var Compiler = require('./src/compiler/compiler.js');
new Compiler({
    "src_root": "/Users/acdvorak/dev/libs/rquirejs/example/src",
    "main": "main.js",
    "module_dir": "modules/",
    "required_modules": [
//        "array",
//        "counter"
    ]
});
