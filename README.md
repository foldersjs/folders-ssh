Folders SSH
=============

The Folders SSH node.js package supports SFTP client and server modes.
This Folders Module is based on SFTP using SSH.

Module can be installed via "npm install folders-ssh".

Example:

Development installation (use --save to save to package.json)

```sh
npm install folders
npm install folders-ssh
```

Round-trip testing of SSH server and client:

Basic Usage

### Constructor

Provider constructor, could pass the special option/param in the config param.

```js

var Fio = require('folders');
var FoldersSsh = require('folders-ssh');

var config = {
        // the connection string, format: ssh//username:password@host:port
        connectionString : "ssh://test:123456@localhost:3334",
        // the option to start up a embedded server when inin the folders, used in test/debug
        enableEmbeddedServer : true,
		// Optional .Backend file system to be used with embedded ssh server.
		backend: Fio.provider('local').create('local')
};

var ssh = new FoldersSsh("localhost-ssh", config);

```

###ls

```js
/**
 * @param uri, the uri to ls
 * @param cb, callback function. 
 * ls(uri,cb)
 */
 
ssh.ls('/', function(err,data) {
        console.log("Folder listing", data);
});
```


###cat


```js

/**
 * @param uri, the file uri to cat 
 * @param cb, callback function.
 * cat(uri,cb) 
 */

ssh.cat('/path1/path2/movie.mp4', function(err,result) {
        console.log("Read Stream ", result.stream);
});
```

### write

```js

/**
 * @param path, string, the path 
 * @param data, the input data, 'stream.Readable' or 'Buffer'
 * @param cb, the callback function
 * write(path,data,cb)
 */

var data = getReadStreamSomeHow('some_movie.mp4');

ssh.write('/path1/path2/some_movie.mp4',data, function(err,result) {
        console.log("Write status ", result);
});
```

### unlink

```js

/**
 * @param path, string, the path 
 * @param cb, the callback function
 * unlink(path,cb)
 */

ssh.unlink('/path1/path2/some_movie.mp4', function(err) {
        
		if (err){
			console.log("Got error ",err);
		}
});
```

### rmdir

```js

/**
 * @param path, string, the path 
 * @param cb, the callback function
 * rmdir(path,cb)
 */

ssh.rmdir('/path1/path2/', function(err) {
        
		if (err){
			console.log("Got error ",err);
		}
});
```