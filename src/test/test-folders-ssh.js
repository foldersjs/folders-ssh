/*
 * Test case for ls/cat/write function on folders-ssh.
 * Using a local embeded server.
 * the server use the folders-local for directory listing and file activities. 
 */

var FoldersSsh = new require('../folders-ssh');

// This test suite will use a embedded localhost SSH server
// If you want to test against a remote server,
// simply change the `host` and `port` properties as well or specify the hostname.
var SSHCredentials = {
	// hostname : test-ssh-server
	host : "localhost",
	port : 3333,
	user : "test",
	pass : "123456"
};

console.log("[Test Case] : start the client");

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

console.log("[Test Case] : SSHCredentialsConnString:",SSHCredentialsConnString);

// start the folder-ssh provider which will consume a ssh client
var ssh = new FoldersSsh("localhost-ssh",{
	connectionString: SSHCredentialsConnString,
	enableEmbeddedServer: true
});

// test file uri,
// TODO may want use a /tmp dir file or a special dir in codebase for testing.
var testFileUri = "./data/test.txt";

// stepp 1: ls command
ssh.ls('/', function(data) {
	console.log("\n###### Step 1: ls ######");
	console.log("[Test Case] : ssh server: ls /");
	console.log(data);
	
	// step 2: write command, put data to ssh server
	var data_ = new Buffer((new Array(960 + 1)).join("Z"));
	ssh.write(testFileUri, data_, function(data){
		console.log("\n###### Step 2: write ######");
		console.log("[Test Case] : write to ./data/test-write.txt to ssh server");
		console.log("[Test Case] : data Content: "+data.toString());
		
		// step 3: cat command, get the file we put to ssh server	
		ssh.cat(testFileUri, function(result) {

			console.log("\n###### Step 3: cat ######")
			console.log("[Test Case] : cat ./test-folders.ssh.js on ssh server");
			// console.log("[Test Case] : data length: "+data.length);
			// console.log("[Test Case] : data Content: "+data.toString());

			// NOTES parse the stream response from server
			var stream = result.stream;
			var buf = [];
			stream.on('readable', function() {
				var chunk;
				while ((chunk = this.read()) !== null) {
					console.log("[Test Case] read chunk, size:" + chunk.length);
					buf.push(chunk);
				}
			}).on('end', function() {
				console.log("[Test Case] read chunk end");

				buf = Buffer.concat(buf);

				// should compare the data we write with the data we got by 'cat' command
				assert = require('assert');
				assert.deepEqual(buf.toString(), data_.toString());

				// step 4: stop the local embeded ssh server if created
				if (sshServer != null) {
					console.log(" [Test Case] : end sshServer");
					sshServer.close();
				}

			});

		});
		
	});

});

