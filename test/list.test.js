var test = require('tape'),
    music = require('..'),
    os = require('os'),
    crypto = require('crypto'),
    path = require('path'),
    fs = require('fs');

test('list artists', function(assert) {
  music.listArtists(function(err, data) {
    if (err) {
      assert.ifError(err);
      return assert.end();
    }
    assert.ok(Array.isArray(data));
    assert.ok(data.length);
    data.forEach(function(item) {
      assert.equal(typeof item, 'string');
      assert.equal(item.indexOf('/'), -1);
    });
    assert.end();
  });
});

test('list albums', function(assert) {
  music.listAlbums('Beck', function(err, data) {
    if (err) {
      assert.ifError(err);
      return assert.end();
    }
    assert.ok(Array.isArray(data));
    assert.ok(data.length);
    data.forEach(function(item) {
      assert.equal(typeof item, 'string');
      assert.equal(item.indexOf('/'), -1);
    });
    assert.end();
  });
});

test('get album', function(assert) {
  var folder = path.join(os.tmpdir(), crypto.randomBytes(8).toString('hex')),
      p;
  music.getAlbum('Beck', 'Morning Phase', folder, function(err) {
    if (err) {
      assert.ifError(err);
      return assert.end();
    }
    fs.readdir(folder, function(err, files) {
      if (err) {
        assert.ifError(err);
        return assert.end();
      }
      assert.ok(files.length);
      assert.end();
    });
  });
});
