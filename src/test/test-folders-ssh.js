var FoldersSsh = new require('../folders-ssh');
var buffersEqual = require('buffer-equal-constant-time');
var ssh2 = require('ssh2');
var fs = require('fs');
var crypto = require('crypto');


// This test suite will use a embedded localhost SSH server
// If you want to test against a remote server,
// simply change the `host` and `port` properties as well or specify the
// hostname.
var SSHCredentials = {
	// hostname : test-ssh-server
	host : "localhost",
	port : 3333,
	user : "test",
	pass : "123456"
};

// if we specify a localhost server.
// we start a embedded ssh test server
var sshServer = null;
if (SSHCredentials.host === "localhost") {

	var sshd = ssh2;
	sshServer = sshd;

function home() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

var pubKey = ssh2.utils.genPublicKey(ssh2.utils.parseKey(fs.readFileSync(home() + '/.ssh/id_rsa.pub')));
new ssh2.Server({
	privateKey: fs.readFileSync(home() + '/.ssh/id_rsa'),
	debug: function(a) { console.log('dEbug', a); }
}, function(client) {
	client.on('authentication', function(ctx) {
		if (ctx.method === 'publickey') {
			if (ctx.signature) {
				var verifier = crypto.createVerify(ctx.sigAlgo);
				verifier.update(ctx.blob);
				if (verifier.verify(pubKey.publicOrig, ctx.signature, 'binary'))
					ctx.accept();
				else
					ctx.reject();
			} else {
				ctx.accept();
			}
			console.log("pubKey");
		}
		else {
			ctx.accept();
		}
		console.log(ctx.method, ctx.username);
	});

	// FIXME: Such nesting.
	client.on('ready', function() {
		// https://github.com/mscdex/ssh2-streams
		client.on('session', function(accept, reject) {
			var session = accept();
			// https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md
			session.once('exec', function(accept, reject, info) {
				console.log('Client wants to execute: ' + require('util').inspect(info.command));
			});

			// See: https://github.com/mscdex/ssh2-streams/blob/master/test/test-sftp.js
			session.once('sftp', function(accept, reject) {
				if (accept) {


var REQUEST = {
  INIT: 1,
  OPEN: 3,
  CLOSE: 4,
  READ: 5,
  WRITE: 6,
  LSTAT: 7,
  FSTAT: 8,
  SETSTAT: 9,
  FSETSTAT: 10,
  OPENDIR: 11,
  READDIR: 12,
  REMOVE: 13,
  MKDIR: 14,
  RMDIR: 15,
  REALPATH: 16,
  STAT: 17,
  RENAME: 18,
  READLINK: 19,
  SYMLINK: 20,
  EXTENDED: 200
};

var list_ = [
      { filename: 'test.txt',
	attrs: {
	  size: 4096,
	}
      }
];

					var sftp = accept();

for(var i in REQUEST) (function(i) { sftp.on(i, function(a,b,c,d) {
	console.dir([i,a,b,c,d],{depth: 3});
}) }(i));;
					sftp.on('STAT', function(id, path) {
						console.log("stat dir", path);


						var constants = require('constants');
           var attrs_ = {
	mode: 0755 | constants.S_IFDIR,
              size: 10 * 1024,
              uid: 9001,
              gid: 9001,
              atime: (Date.now() / 1000) | 0,
              mtime: (Date.now() / 1000) | 0
           };
          sftp.attrs(id, attrs_);

					});
					sftp.once('LSTAT', function(id, path) {
						console.log("lstate dir", path);
					});

					sftp.on('OPENDIR', function(id, path) {
var STATUS_CODE = {
  OK: 0,
  EOF: 1,
  NO_SUCH_FILE: 2,
  PERMISSION_DENIED: 3,
  FAILURE: 4,
  BAD_MESSAGE: 5,
  NO_CONNECTION: 6,
  CONNECTION_LOST: 7,
  OP_UNSUPPORTED: 8
};

				// FIXME: Readdir will want to do something with the handle.
					if(!sftp.handles) sftp.handles = {};

						// FIXME: Use counter.
						var handle = new Buffer([1, 2, 3, Math.round(Math.random(4))]);
						sftp.handle(id, handle);
						sftp.once('CLOSE', function(id, handle) {

						if(!sftp.handles) delete sftp.handles[handle];
							sftp.status(id, STATUS_CODE.OK);
						});

						var once = false;
						sftp.handles[handle] = function() {
							if(!once) once = true;
							else return true;
							return false;
						};
						console.log("open dir", path);
					});
					sftp.on('READDIR', function(id, handle) {
						// var handle_ = new Buffer('node.js');
						var constants = require('constants');
console.log("~~~read dir ", handle, id);
						if(sftp.handles[handle]()) { sftp.name(id, []); return; }

// NOTES: Internal stats for the ssh2 implementation.
function Stats(initial) {
  this.mode = (initial && initial.mode);
  this.permissions = this.mode; // backwards compatiblity
  this.uid = (initial && initial.uid);
  this.gid = (initial && initial.gid);
  this.size = (initial && initial.size);
  this.atime = (initial && initial.atime);
  this.mtime = (initial && initial.mtime);
}
Stats.prototype._checkModeProperty = function(property) {
  return ((this.mode & constants.S_IFMT) === property);
};
Stats.prototype.isDirectory = function() {
  return this._checkModeProperty(constants.S_IFDIR);
};
Stats.prototype.isFile = function() {
  return this._checkModeProperty(constants.S_IFREG);
};
Stats.prototype.isBlockDevice = function() {
  return this._checkModeProperty(constants.S_IFBLK);
};
Stats.prototype.isCharacterDevice = function() {
  return this._checkModeProperty(constants.S_IFCHR);
};
Stats.prototype.isSymbolicLink = function() {
  return this._checkModeProperty(constants.S_IFLNK);
};
Stats.prototype.isFIFO = function() {
  return this._checkModeProperty(constants.S_IFIFO);
};
Stats.prototype.isSocket = function() {
  return this._checkModeProperty(constants.S_IFSOCK);
};


// Sample listing.
var list_ = [
              { filename: '.',
                longname: 'drwxr-xr-x  56 nodejs   nodejs      4096 Nov 10 01:05 .',
                attrs: new Stats({
                  mode: 0755 | constants.S_IFDIR,
                  size: 4096,
                  uid: 9001,
                  gid: 8001,
                  atime: 1415599549,
                  mtime: 1415599590
                })
              },
              { filename: '..',
                longname: 'drwxr-xr-x   4 root     root        4096 May 16  2013 ..',
                attrs: new Stats({
                  mode: 0755 | constants.S_IFDIR,
                  size: 4096,
                  uid: 0,
                  gid: 0,
                  atime: 1368729954,
                  mtime: 1368729999
                })
              },
              { filename: 'foo',
                longname: 'drwxrwxrwx   2 nodejs   nodejs      4096 Mar  8  2009 foo',
                attrs: new Stats({
                  mode: 0777 | constants.S_IFDIR,
                  size: 4096,
                  uid: 9001,
                  gid: 8001,
                  atime: 1368729954,
                  mtime: 1368729999
                })
              },
              { filename: 'bar',
                longname: '-rw-r--r--   1 nodejs   nodejs 513901992 Dec  4  2009 bar',
                attrs: {
                  mode: 0644 | constants.S_IFREG,
                  size: 513901992,
                  uid: 9001,
                  gid: 8001,
                  atime: 1259972199,
                  mtime: 1259972199
                }
              }
            ];
						sftp.name(id, list_);
					});
					sftp.once('OPEN', function(id, path, flags, attrs) {

						console.log("open ", path);
					});
					sftp.once('READ', function(id, handle, offset, length) {
						console.log("read ", handle, offset);
					});
					sftp.on('REALPATH', function(id, path) {
						var name = {
							filename: '/tmp',
							attrs: {
								size: 0
							}
						};
						if(path.indexOf('/tmp') === 0) name.filename = path;
						sftp.name(id, name);
					});
				

				}
			});
		});
	});

}).listen(33330, '127.0.0.1', function() {
  console.log('Listening on port ' + this.address().port);
});

return;
	// server.server.stdout.on('data', function(data) {
	// console.log("server side, recv out data:");
	// console.log(data);
	// // dbgServer(data.toString());
	// });
	//
	// server.server.stderr.on('data', function(data) {
	// console.log("server side, recv err data:");
	// console.log(data);
	// // dbgServer(data.toString());
	// });
	//
	// server.on('error', function(data) {
	// console.log("server side, recv error: ");
	// console.log(data);
	// // dbgServer(data.toString());
	// });
}

// "user:123456@localhost:3333";
var SSHCredentialsConnString = "ssh://";
if (typeof (SSHCredentials.user) != 'undefined' && typeof (SSHCredentials.pass) != 'undefined') {
	SSHCredentialsConnString += SSHCredentials.user + ":" + SSHCredentials.pass + "@";
}
if (typeof (SSHCredentials.host) != 'undefined' && typeof (SSHCredentials.port) != 'undefined') {
	SSHCredentialsConnString += SSHCredentials.host + ":" + SSHCredentials.port;
} else if (typeof (SSHCredentials.hostname) != 'undefined') {
	SSHCredentialsConnString += SSHCredentials.hostname;
}

// start the folder-ssh provider.
var ssh = new FoldersSsh(SSHCredentialsConnString, "localhost-ssh");
// test file uri,
// TODO may want use a /tmp dir file or a special dir in codebase for
// testing.
var testFileUri = "/test.dat";

describe('test for command ls/put/cat', function() {
	it('should cat the file data we put', function(done) {
		this.timeout(5000);

		// step 1: ls command, show the files in current dir
		ssh.ls('/', function(data) {
			console.log("ssh server: ls /");
			console.log(data);

			// step 2: write command, put data to ssh server
			var buf = new Buffer((new Array(960 + 1)).join("Z"));
			var writeReq = {
				data : buf,
				streamId : "test-stream-id",
				shareId : "test-share-id",
				uri : testFileUri
			};
			ssh.write(writeReq, function(data) {

				console.log("\nwrite buffer(960 Z) to the ssh server,result");
				console.log(data);

				// step 3: cat command, get the file we put to ssh server
				var readReq = {
					data : {
						fileId : testFileUri,
						streamId : "test-stream-id",
					},
					shareId : "test-share-id"
				};
				ssh.cat(readReq, function(result) {
					console.log("\nget file on ssh server,result");
					console.log(data);

					var socket = result.data;
					// TODO consume socket stream here
					// var str = "";
					// socket.on("data", function(d) {str += d;});
					// socket.on("close", function(hadErr) {});
					console.log("\nclose the socket stream");
					socket.end();

					// stop the test ssh server
					// FIXME there still is a `Error: read ECONNRESET` in stop the server.
					if (sshServer != null) {
						// server.stop();
						server.close();
						done();
					}
				});
			});

		});
	});
});

// });
