#!/usr/bin/env node

var music = require('..'),
    util = require('util'),
    inquirer = require('inquirer'),
    args = require('minimist')(process.argv.slice(2)),
    command = args._[0];

if (command === 'get') {
  music.listArtists(function(err, artists) {
    inquirer.prompt([
      {
        type: 'list',
        name: 'artist',
        message: 'Artist',
        choices: artists
      }
    ], function(artist) {
      music.listAlbums(artist.artist, function(err, albums) {
        inquirer.prompt([
          {
            type: 'list',
            name: 'album',
            message: 'Album',
            choices: albums
          }
        ], function(album) {
          music.getAlbum(artist.artist, album.album, args.folder)
            .on('progress', function(percent) {
              util.print(
                util.format(
                  '\r\033[KDownloading %s - %s: %s% complete',
                  artist.artist, album.album, percent
                )
              );
            })
            .on('finish', function() {
              util.print('\n');
            });
        });
      });
    });
  });
}
