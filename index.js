var AWS = require('aws-sdk'),
    S3 = new AWS.S3(),
    queue = require('queue-async'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    fs = require('fs'),
    stream = require('stream'),

    bucket = 'softy-tunes';

module.exports.listArtists = listArtists;
module.exports.listAlbums = listAlbums;
module.exports.getAlbum = getAlbum;

function listArtists(callback) {
  S3.listObjects({
    Bucket: bucket,
    Prefix: '',
    Delimiter: '/'
  }, function(err, data) {
    if (err) return callback(err);

    callback(null, data.CommonPrefixes.map(function(item) {
      return item.Prefix.replace('/', '');
    }));
  });
}

function listAlbums(artist, callback) {
  S3.listObjects({
    Bucket: bucket,
    Prefix: artist + '/',
    Delimiter: '/'
  }, function(err, data) {
    if (err) return callback(err);

    callback(null, data.CommonPrefixes.map(function(item) {
      return item.Prefix.replace(artist + '/', '').replace('/', '');
    }));
  });
}

function getAlbum(artist, album, folder, callback) {
  var progress = new stream.Writable({ objectMode: true });

  if (typeof folder === 'function') {
    callback = folder;
    folder = null;
  }

  folder = folder || process.cwd();
  folder = path.join(folder, artist, album);
  callback = callback || function() {};

  mkdirp(folder, listSongs);

  function listSongs(err) {
    if (err) return callback(err);
    S3.listObjects({
      Bucket: bucket,
      Prefix: artist + '/' + album
    }, downloadSongs);
  }

  function downloadSongs(err, data) {
    if (err) return callback(err);

    var q = queue(),
        total = data.Contents.reduce(function(total, item) {
          total += item.Size;
          return total;
        }, 0);

    progress.received = 0;
    progress.setMaxListeners(1000);
    progress._write = function(length, enc, callback) {
      progress.received += length;
      this.emit('progress', Math.round(100 * progress.received / total));
      callback();
    };

    data.Contents.forEach(function(item) {
      var name = path.basename(item.Key),
          outfile;

      if (name === album) return;
      outfile = fs.createWriteStream(path.join(folder, name));

      q.defer(function(next) {
        S3.getObject({ Bucket: bucket, Key: item.Key })
          .createReadStream()
          .once('error', next)
          .on('data', function(chunk) { progress.write(chunk.length); })
          .pipe(outfile)
          .on('finish', next);
      });
    });
    q.await(function() {
      progress.on('finish', callback);
      progress.end();
    });
  }

  return progress;
}
