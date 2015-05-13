/*
 *
 * Folders.io provider: share an FTP endpoint.
 *
 */

var ssh = require('ssh2');

var FoldersSsh = function(connectionString, prefix) {
	this.prefix = prefix;
	this.connectionString = connectionString;
};

module.exports = FoldersSsh;

FoldersSsh.prototype.prepare = function() {
	// FIXME looks like new jsftp(conn) and self.ftp.socket.end() for every
	// action will caused some socket action. Need to check.
	// if write action after the ls action,
	// will caused the 'Error: write after end' when the second action
	var self = this;
	if (typeof (self.ftp) != 'undefined' && self.ftp != null) {
		return self.ftp;
	}

	var connectionString = this.connectionString;
	var uri = uriParse.parse(connectionString, true);
	var conn = {
		host : uri.hostname || uri.host,
		port : uri.port || 21
	};
	if (uri.auth) {
		var auth = uri.auth.split(":", 2);
		conn.user = auth[0];
		if (auth.length == 2) {
			conn.pass = auth[1];
		}
	}
	conn.debugMode = true;
	console.log("conn parse:");
	console.log(conn);
	// NOTES: Could use rush; PWD/CWD needs to be known.
	return new jsftp(conn);
};

FoldersSsh.prototype.ls = function(path, cb) {
	var self = this;
	if (path.length && path.substr(0, 1) != "/")
		path = "/" + path;
	if (path.length && path.substr(-1) != "/")
		path = path + "/";

	var cwd = path || "";

	// NOTES: Not using connection pooling nor re-using the connection.
	var Client = require('ssh2').Client;
	var conn = new Client();
	conn.on('ready', function() {
		console.log('Client :: ready');

		// Via shell - example.
		if(0)
		conn.exec('ls', function(err, stream) {
			if (err) throw err;
				stream.on('close', function(code, signal) {
				console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
				conn.end();
			}).on('data', function(data) {
				console.log('STDOUT: ' + data);
			}).stderr.on('data', function(data) {
				console.log('STDERR: ' + data);
			});
		});

		// Via SFTP
		conn.sftp(function(err, sftp) {
			if (err) throw err;
			sftp.readdir('.', function(err, list) {
				if (err) throw err;
				console.dir(FoldersSsh.prototype.asFolders(path, list));
				conn.end();
			});
		});


	});
	conn.connect({
		host: 'w46.jumis.com',
		port: 22,
		username: 'Downchuck',
		privateKey: require('fs').readFileSync('/Users/chuck/.ssh/id_rsa')
	});

};

FoldersSsh.prototype.asFolders = function(dir, files) {
	var out = [];
	for (var i = 0; i < files.length; i++) {
		var file = files[i];
		var o = {
			name : file.filename
		};
		o.fullPath = dir + file.filename;
		if (!o.meta)
			o.meta = {};
		var cols = [ 'mode', 'permissions', 'uid', 'gid' ];
		for ( var meta in cols)
			o.meta[cols[meta]] = file.attrs[cols[meta]];
		o.uri = "#" + this.prefix + o.fullPath;
		o.size = file.attrs.size || 0;
		o.extension = "txt";
		o.type = "text/plain";
		if (file.longname.substr(0,1) == 'd') {
			o.extension = '+folder';
			o.type = "";
		}

		out.push(o);
	}
	return out;
};

FoldersSsh.prototype.cat = function(data, cb) {
	var self = this;
	var path = data.data.fileId;
	if (path.length && path.substr(0, 1) != "/")
		path = "/" + path;

	// var cwd = path || "";

	// NOTES: Not using connection pooling nor re-using the connection.
	self.ftp = this.prepare();

	// TODO more stat and file check before cat
	self.ftp.ls(path, function(err, content) {
		var files = self.asFolders(path, content);

		if (files.length <= 0) {
			// TODO file not exist
		}
		var file = files[0];

		var headers = {
			"Content-Length" : file.size,
			"Content-Type" : "application/octet-stream",
			"X-File-Type" : "application/octet-stream",
			"X-File-Size" : file.size,
			"X-File-Name" : file.name
		};

		self.ftp.get(path, function(err, socket) {

			// TODO how to pass the data,
			// stream.Readable or Buffer or

			// var str = "";
			// socket.on("data", function(d) {str += d;});
			// socket.on("close", function(hadErr) {socket.end();});

			cb({
				streamId : data.data.streamId,
				data : socket, // FIXME: if socket Readable stream.
				headers : headers,
				shareId : data.shareId
			});

			// self.ftp.socket.end();
		});
	});

};

FoldersSsh.prototype.write = function(data, cb) {
	var self = this;

	var buf = data.data;
	var streamId = data.streamId;
	var shareId = data.shareId;
	var uri = data.uri;

	// TODO uri normalize

	var rspHeaders = {
		"Content-Type" : "application/json"
	};

	self.ftp = this.prepare();

	self.ftp.put(buf, uri, function(hadError) {
		var result;
		if (!hadError) {
			result = "File transferred successfully!";
		} else {
			result = "File transferred failed!";
		}
		console.log("file transferred result:" + result);
		cb({
			streamId : streamId,
			data : "write uri success",
			headers : rspHeaders,
			shareId : shareId
		});

		// self.ftp.socket.end();
	});
};


