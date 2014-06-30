var spawn = require('child_process').spawn;
var bin = require.resolve('mocha/bin/_mocha');

exports.run = function (targets) {
    var proc = spawn(bin, targets, { customFds: [0,1,2] });

    proc.on('exit', function (code, signal) {
        process.on('exit', function () {
            if (signal) {
                process.kill(process.pid, signal);
            } else {
                process.exit(code);
            }
        });
    });
};
