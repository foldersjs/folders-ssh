/*
 * Here we implement a simple uncompleted SSH server.
 * The SSH Server listen on a localhost address.
 * 
 * The SSH Server show a example on how to use the [folders-local](git://github.com/foldersjs/folders.git#master) module.
 * using the local provider for directory listing and file activities. 
 */
var ssh2 = require( 'ssh2' );
var fs = require( 'fs' );
var crypto = require( 'crypto' );
var Config = require('../config');



// folders module for file system provider
var Fio = new require( "folders" );


/*
 * consturctor with the ssh credentials @param credentials ,example { host :
 * "localhost", port : 3333, user : "test", pass : "123456" }; @param debug, the
 * debug function, example console.log('dEbug', a);
 * 
 */
var Server = function ( credentials,debug) {
  this.SSHCredentials = credentials;
  this.debug = debug || Config.server.debug;
  this.sshServer = null;
  console.log( "[SSH Server] : inin the SSH Server,", this.SSHCredentials );
};

module.exports = Server;

// close the server
Server.prototype.close = function () {
  if ( this.sshServer != null ) {
    this.sshServer.close();
  }
};

// start the server
Server.prototype.start = function ( backend ) {

  var SSHCredentials = this.SSHCredentials;
  backend = backend || Fio.provider( 'local' ).create( 'local' );
  // if we specify a localhost server ,we start a embedded ssh test server
  if ( SSHCredentials.host !== "localhost" ) {
    return;
  }
  var sshd = ssh2;

  function home() {
    return process.env[ (process.platform == 'win32') ? 'USERPROFILE' : 'HOME' ];
  }

  // inin the pub key
	
  var pubKey ;		
	
  if (Config.client.publickKeyPath ){
	  
	  pubKey = ssh2.utils.genPublicKey( ssh2.utils.parseKey( fs
    .readFileSync( Config.client.publickKeyPath ) ) );
  }
  else if (Config.client.publicKey ){
	
	   pubKey = ssh2.utils.genPublicKey( ssh2.utils.parseKey( Config.client.publicKey  ) );
	  
  }
  else {
  
	  pubKey = ssh2.utils.genPublicKey( ssh2.utils.parseKey( fs
    .readFileSync( home() + '/.ssh/id_rsa.pub' ) ) );
	  
  }
	

  console.log( "[SSH Server] : pubKey:", pubKey );

  var privateKey ;
	
 if (Config.server.privateKeyPath){

	 privateKey = fs.readFileSync( Config.server.privateKeyPath );
 }
 else if (Config.server.privateKey){
 
	 privateKey = Config.server.privateKey
	 
 }else{
 
	 privateKey = fs.readFileSync( home() + '/.ssh/id_rsa' )
 };
  	
  sshServer = new ssh2.Server( {

    privateKey: privateKey,
    debug: this.debug
  /* ,debug: function(a) { console.log('dEbug', a); } */
  }, function ( client ) {

    console.log( "[SSH Server] : authentication client" );
    client.on( 'authentication', function ( ctx ) {
      console.log( ctx.method, ctx.username );
      if ( ctx.method === 'publickey' && ctx.key.algo === pubKey.fulltype ) {
		  if ( ctx.signature ) {
          var verifier = crypto.createVerify( ctx.sigAlgo );
          verifier.update( ctx.blob );
          if ( verifier.verify( pubKey.publicOrig, ctx.signature, 'binary' ) ) {
            console.log( "[SSH Server] : authentication client accept" );
            ctx.accept();
          } else {
            console.log( "[SSH Server] : authentication client reject" );
            ctx.reject();
          }
        } else {
          console.log( "[SSH Server] : authentication client accept" );
          ctx.accept();
        }
		  
      } else if (ctx.method === 'password'){
		  
		  var username = Config.client.username ;
		  var password = Config.client.password ;
		  if ( ctx.username === username && ctx.password === password){
      		
			  console.log( "[SSH Server] : authentication client accept" );
              ctx.accept();
		  }else{
		  	
			  console.log( "[SSH Server] : authentication client reject" );
        	  ctx.reject();
			  
		  }
		  
	  }else {
        console.log( "[SSH Server] : authentication client reject" );

        ctx.reject();
      }
    } );

    /*
     * set sftp listener
     * 
     * See how to set sftp listener in Server side in ssh2-sftp test case,
     * https://github.com/mscdex/ssh2-streams/blob/master/test/test-sftp.js
     * 
     * see the SFTPStream server events and server methods
     * https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md
     * 
     */
    var setSftpListener = function ( sftp ) {

      // NOTES record the handlers,
      // use the path or something as the key, the stream/handler or something
      // as the value
      sftp.handles = { };

      sftp.cache = { }; //cache files for stats

      // ssh2 status code
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

      // ssh2 file open flag
      var OPEN_MODE = {
        READ: 0x00000001,
        WRITE: 0x00000002,
        APPEND: 0x00000004,
        CREAT: 0x00000008,
        TRUNC: 0x00000010,
        EXCL: 0x00000020
      };

      // file stats
      // NOTES: Internal stats for the ssh2 implementation.

      function Stats( initial ) {
        this.mode = (initial && initial.mode);
        this.permissions = this.mode; // backwards compatiblity
        this.uid = (initial && initial.uid);
        this.gid = (initial && initial.gid);
        this.size = (initial && initial.size);
        this.atime = (initial && initial.atime);
        this.mtime = (initial && initial.mtime);
      }
      Stats.prototype._checkModeProperty = function ( property ) {
        return ((this.mode & constants.S_IFMT) === property);
      };
      Stats.prototype.isDirectory = function () {
        return this._checkModeProperty( constants.S_IFDIR );
      };
      Stats.prototype.isFile = function () {
        return this._checkModeProperty( constants.S_IFREG );
      };
      Stats.prototype.isBlockDevice = function () {
        return this._checkModeProperty( constants.S_IFBLK );
      };
      Stats.prototype.isCharacterDevice = function () {
        return this._checkModeProperty( constants.S_IFCHR );
      };
      Stats.prototype.isSymbolicLink = function () {
        return this._checkModeProperty( constants.S_IFLNK );
      };
      Stats.prototype.isFIFO = function () {
        return this._checkModeProperty( constants.S_IFIFO );
      };
      Stats.prototype.isSocket = function () {
        return this._checkModeProperty( constants.S_IFSOCK );
      };

      var constants = require( 'constants' );

      // convert folders files to ssh files.
      // FIXME need to add some fileds for folders module to support ssh2
      var asSSHFile = function ( files ) {
        var out = [ ];
        for (var i = 0; i < files.length; i++) {
          var file = files[ i ];
          mode = file.extension == '+folder' ? constants.S_IFDIR : constants.S_IFREG;
          var o = {
            filename: file.name,
            longname: constructLongName( file ),
            //longname : file.uri,
            attrs: new Stats( {
              mode: 0644 | mode,
              size: file.size,
              uid: 9001,
              gid: 8001,
              atime: file.modificationTime,
              mtime: file.modificationTime
            } )
          };

          //sftp.cache[file.fullPath] = o.attrs;

          out.push( o );
        }
        //console.log('cache size: ', Object.keys(sftp.cache).length);
        return out;
      }

      sftp.on( 'STAT', function ( id, path ) {
        console.log( "[SSH Server] : stat dir request", id, path );

        var constants = require( 'constants' );
        var dirname = require( 'path' ).dirname( path );
        var basename = require( 'path' ).basename( path );
        /*
		var attrs_ = {
              //mode: 0755 | constants.S_IFDIR,
		  mode: 0755 | constants.S_IFREG,
              size: 1024,
              uid: 9001,
              gid: 9001,
              atime: (Date.now() / 1000) | 0,
              mtime: (Date.now() / 1000) | 0
            };
		*/
        /*
		if (sftp.cache[path]) {
		  console.log('stats found in cache');
		  attrs_ = sftp.cache[path];
		}

            //sftp.attrs( id, new Stats(attrs_));
		sftp.attrs( id, attrs_);
		*/

        var attrs_ = { };

        if ( path == '/' ) {
          attrs_.mode = 0664 | constants.S_IFDIR;
          sftp.attrs( id, attrs_ );
          return;
        }

        backend.ls( dirname, function ( err, res ) {
          //asSSHFile( res );

          for (i = 0; i < res.length; ++i) {

            var file = res[ i ];
            if ( file.name == basename ) {

              mode = file.extension == '+folder' ? constants.S_IFDIR : constants.S_IFREG;


              attrs_ = new Stats( {
                mode: 0644 | mode,
                size: file.size,
                uid: 9001,
                gid: 8001,
                atime: file.modificationTime,
                mtime: file.modificationTime
              } )

              break;

            }

          }


          sftp.attrs( id, attrs_ );

        } );



      } );

      sftp.on( 'LSTAT', function ( id, path ) {
        console.log( "[SSH Server] : lstate dir request", id, path );

        //get file attribute?
        var attrs_ = new Stats( {
          mode: 0644 | constants.S_IFREG,
          size: 1024,
          uid: 9001,
          gid: 9001,
          atime: (Date.now() / 1000) | 0,
          mtime: (Date.now() / 1000) | 0
        } );

        /*
        if (sftp.cache[path]) {
          console.log('stats found in cache');
          attrs_ = sftp.cache[path];
        }
        */
        //sftp.attrs( id, new Stats(attrs_));
        sftp.attrs( id, attrs_ );

      } );


      sftp.on( 'OPENDIR', function ( id, path ) {
        console.log( "[SSH Server] : sftp on opendir request, id:" + id + ", path:" + path );

        // FIXME: Use counter.
        //var handle_ = new Buffer([ 1, 2, 3, Math.round(Math.random(4)) ]);
        var handle_ = new Buffer( randomValueHex() );
        //sftp.handles[ handle_ ] = path;

        sftp.handles[ handle_ ] = {
          path: path,
          next_index: 0, //index of the next file to be returned in readdir. We will return all files so this value will either be 0 or files count
        };

        sftp.handle( id, handle_ );

      } );


      sftp.on( 'READDIR', function ( id, handle ) {
        console.log( "[SSH Server] : readdir, id: ", id, handle );


        var path = sftp.handles[ handle ].path;

        //if (sftp.handles[handle]()) {
        if ( sftp.handles[ handle ].next_index > 0 ) {
          console.log( 'return empty to indicate end of readdir' )
          sftp.name( id, [ ] );
          return;
        }
        // NOTES here we call the folders module(function folders-local.ls) to
        // access local files.


        backend.ls( path, function ( err, res ) {
          var list_ = asSSHFile( res );
          sftp.handles[ handle ].next_index = list_.length;
          console.log( "[SSH Server] : sftp readir response, id:" + id + ", list.length: ", list_.length );
          sftp.name( id, list_ );
        } );
      } );

      // open the file, createReadStream/createWriteStream will first open the
      // file.


      sftp.on( 'OPEN', function ( id, path, flags, attrs ) {
        console.log( "[SSH Server] : sftp open request ", id, path, flags, attrs );

        // 'r', open file for reading
        if ( flags == OPEN_MODE.READ ) {


          // NOTES here we call the folders module(function folders-local.cat)
          // to access backend files.

          backend.cat( path, function cb( err, results ) {
            if ( err ) {
              console.log( err );
              sftp.status( id, STATUS_CODE.NO_SUCH_FILE );
              return;
            }



            // add the readable stream to handles cache.
            var stream = results.stream;

            //var handle_ = new Buffer(/http_window.io_0:ssh/ + path);
            var handle_ = new Buffer( randomValueHex() ); //var handle_ = new Buffer(/http_window.io_0:ssh/ + path)
            sftp.handles[ handle_ ] = {
              stream: stream,
              transferred: 0, //count how much bytes have been transferred
              //FIXME: move buff into here,
              hooked: false, //whether we already hook the events
              //readId: 0, //whether we have some FTP read command waiting for data
              queuedRead: [], //the read commands that are being queued, sometimes SFTP might issue multiple read concurrently and wait for the results to speed up through put
              readLength: 0, //what length is the waiting read command want to read.
              isReadEnd: false,
              buff: new Buffer( 0 )
            };
            sftp.handle( id, handle_ );


            // stop emitting data events
            stream.pause();

          } );


        }

        // 'w', open file for writing
        if ( flags == (OPEN_MODE.TRUNC | OPEN_MODE.CREAT | OPEN_MODE.WRITE) ) {


          //var handle_ = new Buffer(/http_window.io_0:ssh/ + path);
          var handle_ = new Buffer( randomValueHex() );

          // add the path to handles cache only, we will invoke the
          // folders-local module when 'WRITE'


          var pass = new require( 'stream' ).PassThrough()


          backend.write( path, pass, function ( err, result ) {

            if ( err ) {
              sftp.status( id, STATUS_CODE.FAILURE );
              return;
            }

          } );


          sftp.handles[ handle_ ] = { stream: pass, mode: 'w' };
          sftp.handle( id, handle_ );
          console.log( 'Opening file for write' );

        }
      } );

      sftp.on( 'CLOSE', function ( id, handle ) {
        console.log( "[SSH Server] : sftp close request ", id, handle );


        if ( sftp.handles[ handle ].mode == 'w' ) {

          sftp.handles[ handle ].stream.push( null );
        }

        if ( sftp.handles[ handle ] )

          delete sftp.handles[ handle ];

        sftp.status( id, STATUS_CODE.OK );


      } );

      // read file from ssh2
      //var isReadEnd = false;

      //var read = 0 ;
      //var buff = new Buffer(0);


      sftp.on( 'READ', function ( id, handle, offset, length ) {

        console.log( "[SSH Server] : sftp read request ", id, handle, offset, length );


        // get the stream from the cache
        var stream = sftp.handles[ handle ].stream;


        if ( stream == null || typeof (stream) == 'undefined' ) {

          sftp.status( id, STATUS_CODE.NO_SUCH_FILE );
          return;
        }



        if ( sftp.handles[ handle ].isReadEnd ) { //we reach end-of-read, and transferred all the data!
          console.log( "[SSH Server] : buffer end, id: " + id + " transferred: " + sftp.handles[ handle ].transferred );

          sftp.status( id, STATUS_CODE.EOF );
          sftp.handles[ handle ].isReadEnd = false;

          sftp.handles[ handle ].buff = null;
          return;
        }


        if ( !sftp.handles[ handle ].hooked ) { //file has not been transferred => initial setup
          sftp.handles[ handle ].hooked = true;

          // register only one 'end listner' during  
          // file transfer
          stream.once( 'end', function () {
            console.log( "[SSH Server] : read stream end," );

            //fulfill the last queued read with whatever I have:
            if ( sftp.handles[ handle ].queuedRead.length > 0 ) { //has an waiting read command
              //var length = sftp.handles[handle].readLength; //the read length from the request
              var cmd = sftp.handles[ handle ].queuedRead[ 0 ];
              //var length = cmd.length;
              var id = cmd.id;
              sftp.data( id, sftp.handles[ handle ].buff );
            }
            sftp.handles[ handle ].queuedRead.shift();

            if ( sftp.handles[ handle ].queuedRead.length > 0 ) {
              //still got outstanding queued read, use this to deliver EOF
              var cmd = sftp.handles[ handle ].queuedRead[ 0 ];
              var id = cmd.id;
              sftp.status( id, STATUS_CODE.EOF );
            }

            sftp.handles[ handle ].isReadEnd = true;
          // FIXME need a better way to specify the id,
          //sftp.status( id, STATUS_CODE.EOF );
          } );

          //set the 'data' and 'end' handler.
          stream.on( 'data', function ( chunk ) {
            console.log( 'received data length: ', chunk.length );
            // after recv a chunk data, we stop emitting data events
            /*
                    stream.pause();

                    var chunkLen = chunk.length;
                    console.log( "[SSH Server] : stream readable, id: " + id + ", length:"+ chunk.length );

                    if ( chunkLen > length ) {
                      // extract buffer of length 'length' from chunk

                      var buf1 = chunk.slice( 0, length );
                      // store remaining chunk in buff
                      buff = chunk.slice( length );

			  sftp.handles[handle].transferred+=length;
                      // send buf1 of length to client
                      sftp.data( id, buf1 );
                    } else {
                      // chunk is smaller then requested length
                      // send it client as it is.
			  console.log('sending chunk');
                      sftp.data( id, chunk );
			  
			  sftp.handles[handle].transferred+=chunkLen;
			  
			  //no more buffer => resume
			  stream.resume();
                    }
                    */
            sftp.handles[ handle ].buff = Buffer.concat( [
              sftp.handles[ handle ].buff,
              chunk
            ] );
            console.log( 'buffer level: ', sftp.handles[ handle ].buff.length );
            if ( sftp.handles[ handle ].queuedRead.length > 0 ) { //has an waiting read command
              //var length = sftp.handles[handle].readLength; //the read length from the request
              var cmd = sftp.handles[ handle ].queuedRead[ 0 ];
              var length = cmd.length;
              var id = cmd.id;
              if ( sftp.handles[ handle ].buff.length >= length ) { //enough data to fulfill request
                var buf1 = sftp.handles[ handle ].buff.slice( 0, length );
                sftp.handles[ handle ].transferred += length;
                sftp.data( id, buf1 );
                sftp.handles[ handle ].buff = sftp.handles[ handle ].buff.slice( length );
                console.log( 'fulfill waiting read: ' + id + " transferred: " + sftp.handles[ handle ].transferred + ' buffer level: ' + sftp.handles[ handle ].buff.length );
                //sftp.handles[handle].readId  = 0;
                //sftp.handles[handle].readLength  = 0;
                //remove the request from queue
                sftp.handles[ handle ].queuedRead.shift();
              }
              //don't send partial data!
              /*
			  else {
				//send all we have
				sftp.handles[handle].transferred += buff.length;
				sftp.data( sftp.handles[handle].readId, buff );
				buff = new Buffer(0);
			  }*/


            }

            if ( sftp.handles[ handle ].buff.length > 1E6 ) {
              stream.pause(); //buffer level too high, wait for downstream to consume first
            }
          } );
        }

        if ( sftp.handles[ handle ].buff.length >= length ) {
          var buf1 = sftp.handles[ handle ].buff.slice( 0, length );
          sftp.handles[ handle ].transferred += length;
          sftp.data( id, buf1 );
          sftp.handles[ handle ].buff = sftp.handles[ handle ].buff.slice( length );

          console.log( 'transferred: ' + sftp.handles[ handle ].transferred + ' buffer level: ' + sftp.handles[ handle ].buff.length );
        } else {
          /*
		  //send all we have
		  sftp.handles[handle].transferred += buff.length;
		  if (buff.length > 0) { //only return if we have data!
			sftp.data( id, buff );
			buff = new Buffer(0);
		  }
		  else {
		  */
          //not enough data, wait first!
          console.log( 'queue read: ', id, length ); //exhausted the buffer!
          sftp.handles[ handle ].queuedRead.push( {
            id: id,
            length: length
          } );
        //sftp.handles[handle].readId = id;
        //sftp.handles[handle].readLength = length;
        //}
        }

        if ( sftp.handles[ handle ].buff.length < 1E6 && !sftp.handles[ handle ].isReadEnd ) {
          console.log( 'resume stream' );
          stream.resume(); //downstream has consumed enough buffer => resume read!
        }


        /*
            if ( buff ) {
              if ( buff.length > length ) {
                var buf1 = buff.slice( 0, length );
			sftp.handles[handle].transferred += length;
                sftp.data( id, buf1 );
                buff = buff.slice( length );

              } else {
			sftp.handles[handle].transferred += buff.length;
                sftp.data( id, buff );
                buff = null;
                stream.resume();
              }
              //return ;

            } else {
              stream.resume();

            }
            */




      } );

      // FIXME need to add function which write data to certain offset
      sftp.on( 'WRITE', function ( id, handle, offset, data ) {
        console.log( "[SSH Server] : sftp write request, ", id, handle, offset,
          data );

        var rs = sftp.handles[ handle ].stream;


        if ( rs == null || typeof (rs) == 'undefined' ) {
          sftp.status( id, STATUS_CODE.FAILURE );
          return;
        }


        rs.push( data );
        sftp.status( id, STATUS_CODE.OK );

      /*	
          var path = sftp.handles[handle];
          if (path == null || typeof (path) == 'undefined') {
          	sftp.status(id, STATUS_CODE.FAILURE);
          	return;

			

          }
          

          // generate the request message for folders module
          var req = {
          	uri : path,
          	data : data,

          	// FIXME need to add header,streamId,shareId
          	streamId : "streamId",
          	headers : {
          		"X-File-Date" : "2013-09-07T21:40:55.000Z",
          		"X-File-Name" : "stub-file.txt",
          		"X-File-Size" : "960",
          		"X-File-Type" : "text/plain"
          	},
          	shareId : "test-share-Id"
          };
          
          // NOTES here we call the folders module(function folders-local.write)
          // to access local files.


          local.write(req, function(result, err) {
          	if (err) {
          		sftp.status(id, STATUS_CODE.FAILURE);
          		return;
          	}
          	console.log(result);

          	sftp.status(id, STATUS_CODE.OK);

          });
          */
      } );

      sftp.on( 'REMOVE', function ( id, path ) {
        console.log( "[SSH Server] : sftp remove request, ", id, path );


        backend.unlink( path, function ( err ) {

          if ( err ) {
            sftp.status( id, STATUS_CODE.FAILURE );
          } else {

            sftp.status( id, STATUS_CODE.OK );
          }

        } );

      } );

      sftp.on( 'RMDIR', function ( id, path ) {
        console.log( "[SSH Server] : sftp rmdir request, ", id, path );

        backend.rmdir( path, function ( err, res ) {

          if ( err ) {
            sftp.status( id, STATUS_CODE.FAILURE );
          } else {

            sftp.status( id, STATUS_CODE.OK );
          }


        } );

      } );

      sftp.on( 'REALPATH', function ( id, path ) {
        console.log( 'REALPATH', path );

        path = require( 'path' ).normalize( path );
        var name = {
          filename: '/',
          attrs: new Stats( {
            mode: 0644 | constants.S_IFDIR,
            size: 4096,
            uid: 9001,
            gid: 8001,
            atime: (Date.now() / 1000) | 0,
            mtime: (Date.now() / 1000) | 0
          } )
        };


        if ( path != '.' )
          name.filename = path;

        sftp.name( id, name );
      } );



    };

    // FIXME: Such nesting.
    // ssh session, shell/sftp
    client.on( 'ready', function () {
      // https://github.com/mscdex/ssh2-streams
      client.on( 'session', function ( accept, reject ) {
        var session = accept();
        // https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md
        session.once( 'exec', function ( accept, reject, info ) {
          console.log( '[SSH Server] : Client wants to execute: ' + require( 'util' ).inspect( info.command ) );

        } );

        // See:
        // https://github.com/mscdex/ssh2-streams/blob/master/test/test-sftp.js
        session.once( 'sftp', function ( accept, reject ) {
          if ( accept ) {

            var sftp = accept();
            setSftpListener( sftp );
          }
        } );
      } );
    } );
	  
	client.on( 'end', function () {
		
		console.log( '[SSH Server] :  The client socket disconnected.' );
     
    } );
	  
	client.on( 'close', function (hadError) {
		
		if (hadError){
			console.log( '[SSH Server] :  The client socket was closed due to error');
		}
		
		console.log( '[SSH Server] :  The client socket was closed');
     
    } );  
	 

  } );

  // bind the address
  sshServer.listen( SSHCredentials.port, SSHCredentials.host, function () {
    console.log( '[SSH Server] : Listening on port ' + this.address().port );
  } );

  this.sshServer = sshServer;

};

var constructLongName = function ( file ) {

  var permissions;
  var d = new Date( parseFloat( file.modificationTime ) );

  var date = [
    d.toString().substr( 4, 6 ),
    d.getHours() + ":" + d.getMinutes()
  ].join( ' ' );

  if ( file.extension == '+folder' ) {

    permissions = 'drw-rw-r--'
  } else {

    permissions = '-rw-rw-r--'

  }
  var longname = [ ];
  longname[ 0 ] = permissions;
  longname[ 1 ] = 1;
  longname[ 2 ] = 'ssh';
  longname[ 3 ] = 'ssh';
  longname[ 4 ] = file.size;
  longname[ 5 ] = date;
  longname[ 6 ] = file.name;
  longname = longname.join( ' ' );

  return longname;
};

function randomValueHex( len ) {
  len = len || 10;
  return require( 'crypto' ).randomBytes( Math.ceil( len / 2 ) )
    .toString( 'hex' ) // convert to hexadecimal format
    .slice( 0, len ); // return required number of characters
}
