var stitch  = require('stitch');
var fs      = require('fs');

var package = stitch.createPackage({
    paths: [__dirname + '/lib']
});

package.compile(function (err, source){
    fs.writeFile('./release/boneidle.js', source, function (err) {
        if (err) throw err;
        console.log('Compiled boneidle.js');
    })
})