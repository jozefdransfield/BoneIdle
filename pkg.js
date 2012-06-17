var stitch  = require('stitch');
var fs      = require('fs');

var pkg = stitch.createPackage({
    paths: [__dirname + '/lib']
});

pkg.compile(function (err, source){
    fs.writeFile('./release/boneidle.js', source, function (err) {
        if (err) throw err;
        console.log('Compiled boneidle.js');
    })
})