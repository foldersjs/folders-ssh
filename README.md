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

```js
var FoldersSsh = require('folders-ssh');

var config = {
        // the connection string, format: ssh//username:password@host:port
        connectionString : "ssh://test:123456@localhost:3334",
        // the option to start up a embedded server when inin the folders, used in test/debug
        enableEmbeddedServer : true
};

var ssh = new FoldersSsh("localhost-ssh", config);

ssh.ls('.', function(data) {
        console.log("Folder listing", data);
});
```

