/*
 *
 * Folders.io provider: share an FTP endpoint.
 *
 */
var uriParse = require( 'url' );
var ssh = require( 'ssh2' );
var path = require( 'path' );
var mime = require( 'mime' );

var Config = require('../config');

var FoldersSsh = function ( prefix, options ) {
  this.prefix = prefix || Config.prefix;
  this.connectionString = options.connectionString ;

  // this is a flag to start a embedded ssh(sftp) server, using for test/debug
  var enableEmbeddedServer = options.enableEmbeddedServer ;
  if ( enableEmbeddedServer ) {
    var conn = parseConnString( this.connectionString );
    this.credentials = conn;

    var SSHServer = require( './embedded-ssh-server' );
    this.server = new SSHServer( conn );
    this.server.start( options.backend );
  }
};

module.exports = FoldersSsh;

FoldersSsh.prototype.features = FoldersSsh.features = {
  cat: true,
  ls: true,
  write: true,
  server: true
};

FoldersSsh.prototype.prepare = function () {
  // FIXME looks like new jsftp(conn) and self.ftp.socket.end() for every
  // action will caused some socket action. Need to check.
  // if write action after the ls action,
  // will caused the 'Error: write after end' when the second action
  var self = this;
  if ( typeof (self.ftp) != 'undefined' && self.ftp != null ) {
    return self.ftp;
  }
  var connectionString = this.connectionString;
  var conn = parseConnString( connectionString );

  console.log( "conn to ssh server ", conn );
  // NOTES: Could use rush; PWD/CWD needs to be known.
  return new jsftp( conn );
};

FoldersSsh.prototype.connect = function ( conn ) {
  var privateKey ;
  if (Config.client.privateKeyPath){
  
	  privateKey = require( 'fs' ).readFileSync( Config.client.privateKeyPath );
	  
  }
  else if (Config.client.privateKey){
	 
	  privateKey = Config.client.privateKey ;
  }
  else{
	  
	  privateKey = require( 'fs' ).readFileSync( home() + '/.ssh/id_rsa' );
  
  }
		
  conn.connect( {
    host: this.credentials.host,
    port: this.credentials.port,
    username: this.credentials.user,

    privateKey: privateKey
  } );
};

FoldersSsh.prototype.ls = function ( path, cb ) {
  console.log( "[folders-ssh ls] folders-ssh, ls ", path );
  var self = this;
  if ( path.length && path.substr( 0, 1 ) != "/" )
    path = "/" + path;
  if ( path.length && path.substr( -1 ) != "/" )
    path = path + "/";

  var cwd = path || "";

  // NOTES: Not using connection pooling nor re-using the connection.
  var Client = require( 'ssh2' ).Client;
  var conn = new Client();
  conn.on( 'ready', function () {
    console.log( '[folders-ssh ls] Client :: ready' );

    // Via shell - example.
    if ( 0 )
      conn.exec( 'ls', function ( err, stream ) {
        if ( err ) {
          console.error( "[folders-ssh ls] error in ssh,", err );
          cb( null, err );
        }
        stream.on( 'close', function ( code, signal ) {
          console.log( 'Stream :: close :: code: ' + code + ', signal: ' + signal );
          conn.end();
        } ).on( 'data', function ( data ) {
          console.log( 'STDOUT: ' + data );
        } ).stderr.on( 'data', function ( data ) {
          console.log( 'STDERR: ' + data );
        } );
      } );

    // Via SFTP
    console.log( "[folders-ssh ls] begin to send sftp request," );
    conn.sftp( function ( err, sftp ) {
      if ( err ) {
        console.error( "[folders-ssh ls] error in sftp,", err );
        return cb( err );
      }

      console.log( "[folders-ssh ls] begin to open dir" );

      sftp.opendir( path, function ( err, handle ) {
        if ( err ) {
          console.error( "[folders-ssh ls] error in opendir,", err )
          return cb( err );
        }

        console.log( "[folders-ssh ls] begin conn ftp read dir,", handle );
        sftp.readdir( handle, { full: true }, function ( err, list ) {
          if ( err ) {
            console.error( "[folders-ssh ls] error in sftp,", err );
            return cb( err );
          }

          console.log( "[folders-ssh ls] readdir result length," + list.length );
          //console.dir(FoldersSsh.prototype.asFolders(path, list));
          cb( null, FoldersSsh.prototype.asFolders( path, list ) );
          conn.end();
        } );

      } );


    } );


  } );

  this.connect( conn );
};



/*
 * This methods translates sftp records to folders.io compatible records.
 * 
 */
FoldersSsh.prototype.asFolders = function ( dir, files ) {

  var z = [ ];

  for (var i = 0; i < files.length; ++i) {
    var file = files[ i ];
    var o = { };
    o.name = file.filename;
    o.extension = path.extname( o.name );
    o.size = file.attrs.size || 0;
    if ( file.longname.substr( 0, 1 ) == 'd' ) {
      o.extension = '+folder';
      o.type = "";
    }
    o.type = (o.extension == '+folder' ? "" : mime.lookup( o.extension ));
    o.fullPath = dir + file.filename;

    //o.uri = "#" + this.prefix + o.fullPath;
    o.uri = o.fullPath;
    if ( !o.meta )
      o.meta = { };
    var cols = [ 'mode', 'permissions', 'uid', 'gid' ];
    for (var meta in cols)
      o.meta[ cols[ meta ] ] = file.attrs[ cols[ meta ] ];
    o.modificationTime = file.attrs.mtime;
    z.push( o );


  }


  return z;
};

//FIXME need to adjust the input/cb param
FoldersSsh.prototype.cat = function ( path, cb ) {

  var self = this;
  //var path = data.data.fileId;
  //	if (path.length && path.substr(0, 1) != "/")
  //		path = "/" + path;

  console.log( "[folders-ssh cat] folders-ssh, cat ", path );

  // NOTES: Not using connection pooling nor re-using the connection.
  var Client = require( 'ssh2' ).Client;
  var conn = new Client();
  conn.on( 'ready', function () {
    console.log( '[folders-ssh cat] Client :: ready' );

    // Via shell - example.
    if ( 0 )
      conn.exec( 'cat', function ( err, stream ) {
        if ( err ) {
          console.error( "[folders-ssh cat] error in ssh,", err );
          cb( null, err );
        }
        stream.on( 'close', function ( code, signal ) {
          console.log( 'Stream :: close :: code: ' + code + ', signal: ' + signal );
          conn.end();
        } ).on( 'data', function ( data ) {
          console.log( 'STDOUT: ' + data );
        } ).stderr.on( 'data', function ( data ) {
          console.log( 'STDERR: ' + data );
        } );
      } );

    // Via SFTP
    console.log( "[folders-ssh cat] begin to send cat request," );
    conn.sftp( function ( err, sftp ) {
      if ( err ) {
        console.error( "[folders-ssh cat] error in sftp conn,", err );
        return cb( err );
      }

      console.log( "[folders-ssh cat] begin conn sftp read file," );

      //var we simply return read stream rather than buffer
      var stream = sftp.createReadStream( path );
      //FIXME need to add size,name meta information here
      cb( null, { stream: stream } );

      //FIXME how to close the conn here??


      // NOTES test on pasre the response from server
      // var buf = [];
      // sftp.createReadStream(path).on('readable', function() {
      // var chunk;
      // while ((chunk = this.read()) !== null) {
      // console.log("[folders-ssh cat] read chunk, size:"+chunk.length);
      // buf.push(chunk);
      // }
      // }).on('end', function() {
      // console.log("[folders-ssh cat] read chunk end");
      //        	 
      // buf = Buffer.concat(buf);
      // cb(buf);
      // conn.end();
      // });

    } );

  } );

  this.connect( conn );

};


FoldersSsh.prototype.write = function ( path, data, cb ) {
  var self = this;

  console.log( "[folders-ssh write] folders-ssh, write ", path );

  // NOTES: Not using connection pooling nor re-using the connection.
  var Client = require( 'ssh2' ).Client;
  var conn = new Client();
  conn.on( 'ready', function () {
    console.log( '[folders-ssh write] Client :: ready' );

    // Via shell - example.
    if ( 0 )
      conn.exec( 'cat', function ( err, stream ) {
        if ( err )
          throw err;
        stream.on( 'close', function ( code, signal ) {
          console.log( 'Stream :: close :: code: ' + code + ', signal: ' + signal );
          conn.end();
        } ).on( 'data', function ( data ) {
          console.log( 'STDOUT: ' + data );
        } ).stderr.on( 'data', function ( data ) {
          console.log( 'STDERR: ' + data );
        } );
      } );

    // Via SFTP
    console.log( "[folders-ssh write] begin to send write request," );
    conn.sftp( function ( err, sftp ) {
      if ( err ) {
        console.error( "[folders-ssh write] error in sftp conn,", err );
        cb( err );
      }

      console.log( "[folders-ssh write] begin conn sftp read file," );

      // write data to ssh server
      try {


        //var stream = sftp.createWriteStream(path);

        if ( data instanceof Buffer ) {
          stream.write( data, function () {
            stream.end( function () {
              cb( "write uri success" );
              conn.end();
            } );
          } );
        } else {

          var errHandle = function ( e ) {
            cb( e.message );
            conn.end();
          };

          sftp.open( path, 'w', function ( err, handle ) {


            if ( err ) {

              return errHandle( err );
            }

            data.on( 'data', function ( buf ) {


              sftp.write( handle, buf, 0, buf.length, 5, function ( err ) {

                if ( err ) {
                  return errHandle( err );
                }

              } );

            } );

            data.on( 'end', function () {

              //sftp.end();

            } );

            data.on( 'close', function () {


              sftp.close( handle, function ( err ) {


                if ( err ) {
                  return errHandle( err );
                }

              } );

            } );

          } );

        }
        /*
        data.on('error', errHandle).pipe(stream).on('error', errHandle);

        data.on('end', function() {


        	//stream.end();
        	cb("write uri success");

        	conn.end();
        });

				}
        */

      } catch (e) {
        cb( "unable to write uri," + e.message );
        conn.end();
      };

    } );

  } );

  this.connect( conn );
};

FoldersSsh.prototype.unlink = function ( path, cb ) {

  var self = this;

  console.log( "[folders-ssh unlink] folders-ssh, unlink ", path );

  // NOTES: Not using connection pooling nor re-using the connection.
  var Client = require( 'ssh2' ).Client;
  var conn = new Client();
  conn.on( 'ready', function () {
    console.log( '[folders-ssh unlink] Client :: ready' );
    // Via SFTP
    console.log( "[folders-ssh unlink] begin to send unlink request," );
    conn.sftp( function ( err, sftp ) {
      if ( err ) {
        console.error( "[folders-ssh unlink] error in sftp conn,", err );
        return cb( err );
      }

      console.log( "[folders-ssh unlink] begin conn sftp unlink file," );

      sftp.unlink( path, function ( err ) {

        if ( err ) {

          console.error( "[folders-ssh unlink] error in sftp unlink,", err );
          return cb( err );

        }
        cb();

      } );

    } );

  } );

  this.connect( conn );


}

FoldersSsh.prototype.rmdir = function ( path, cb ) {

  var self = this;

  console.log( "[folders-ssh rmdir] folders-ssh, rmdir ", path );

  // NOTES: Not using connection pooling nor re-using the connection.
  var Client = require( 'ssh2' ).Client;
  var conn = new Client();
  conn.on( 'ready', function () {
    console.log( '[folders-ssh rmdir] Client :: ready' );
    // Via SFTP
    console.log( "[folders-ssh rmdir] begin to send rmdir request," );
    conn.sftp( function ( err, sftp ) {
      if ( err ) {
        console.error( "[folders-ssh rmdir] error in sftp conn,", err );
        return cb( err );
      }

      console.log( "[folders-ssh rmdir] begin conn sftp rmdir dir," );

      sftp.rmdir( path, function ( err ) {

        if ( err ) {

          console.error( "[folders-ssh rmdir] error in sftp rmdir,", err );
          return cb( err );

        }
        cb();

      } );


    } );

  } );

  this.connect( conn );

}

var home = function () {
  return process.env[ (process.platform == 'win32') ? 'USERPROFILE' : 'HOME' ];
};

var parseConnString = function ( connectionString ) {
  var uri = uriParse.parse( connectionString, true );
  var conn = { host: uri.hostname || uri.host, port: uri.port || 21 };
  if ( uri.auth ) {
    var auth = uri.auth.split( ":", 2 );
    conn.user = auth[ 0 ];
    if ( auth.length == 2 ) {
      conn.pass = auth[ 1 ];
    }
  }
  conn.debugMode = true;

  return conn;
};
