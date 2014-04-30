var DepTree = require('./src/compiler/deptree.js');
var tree = new DepTree('/Users/acdvorak/dev/libs/rquirejs/example/src', [ 'main.js' ]);
tree.scan(function() {
    console.log('DONE!');
    console.log(tree.depFiles);
});

//var File = require('./src/lib/file');
//var main = new File('/Users/acdvorak/dev/libs/rquirejs/example/src', 'main.js');
//console.log('main.js deps: ', main.directDependencies);
