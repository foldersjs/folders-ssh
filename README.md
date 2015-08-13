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
### Configuration
The private and public keys required by this module can be set in config.js

#### Server keys
We need a private key  in order for embedded ssh server to work.the key can be provided by file or enivronment variable 

##### Credentials from Disk


You can Edit config.js and specifiy the path of this ssh key file at around line 13

```
Config.server.privateKeyPath = '/home/bob/.ssh/id_rsa';
```
##### Credentials from Environment Variables
You can set environment variables to provide server private key . 
This means that if you properly set your environment variables, 
you do not need to manage credentials in your application at all.

The keys name must be as follows:

```
export SSH_SERVER_PRIVATE_KEY =  "your rsa key" 

```
if both 'Credentials from Disk' 'and 'Credentials from Environment Variables' are set then former takes precedence over later 

#### Client keys
Client private and public keys need to be configured for successfull authentication and data transfer

##### Public key
Client public key is used by server for verifying digital signatures under ssh protocol.They can be configured in two ways 

###### Credentials from Disk


You can Edit config.js and specifiy the path of this ssh key file at around line 20

```
Config.client.publickKeyPath  = '/home/alice/.ssh/id_rsa.pub';

```
###### Credentials from Environment Variables

You can set environment variables to provide client public key . 

The keys name must be as follows:

```
export SSH_CLIENT_PUBLIC_KEY =  "your rsa key" 

```

##### Private key
Client private key is used by client for  digitally signing messages under ssh protocol.They can be configured in two ways 

###### Credentials from Disk


You can Edit config.js and specifiy the path of this ssh key file at around line 20

```
Config.client.privateKeyPath  = '/home/alice/.ssh/id_rsa';

```
###### Credentials from Environment Variables

You can set environment variables to provide client private key . 

The keys name must be as follows:

```
export SSH_CLIENT_PRIVATE_KEY =  "your rsa key" 

```
if both 'Credentials from Disk' 'and 'Credentials from Environment Variables' are set then former takes precedence over later

### Authentication using username and password

You can edit config.js to allow specific user to access folders-ssh embedded server

you can either set environ variables SSH_CLIENT_USERNAME and SSH_CLIENT_PASSWORD or edit config .js around line 23,24

```
Config.client.username = process.env.SSH_CLIENT_USERNAME || 'root';
Config.client.password = process.env.SSH_CLIENT_PASSWORD || 'pass' ;
```
Now user 'root' with password 'pass' can access folders-ssh embedded server and make requests or transfer data 
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