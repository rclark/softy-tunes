#!/usr/bin/env node

var music = require('..'),
    util = require('util'),
    inquirer = require('inquirer'),
    args = require('minimist')(process.argv.slice(2)),
    path = require('path'),
    bits, album, artist, folder,
    command = args._[0];

command = command || 'get';

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

if (command === 'put') {
  if (!args.folder) {
    console.error('Specify the folder you want to upload');
    process.exit(1);
  }

  folder = path.resolve(args.folder);
  if (folder.slice(-1) === '/') folder = folder.slice(0, -1);
  folder = folder.replace('/\\ /g', ' ');
  bits = folder.split(path.sep);
  album = bits.pop();
  artist = bits.pop();

  inquirer.prompt([
    {
      type: 'confirm',
      name: 'artist',
      message: 'Artist is "' + artist + '"?'
    },
    {
      type: 'confirm',
      name: 'album',
      message: 'Album is "' + album + '"?'
    }
  ], function(details) {
    if (!details.artist || !details.album) {
      console.error('You must name the folders properly first');
      process.exit(1);
    }

    music.uploadAlbum(artist, album, folder)
      .on('progress', function(percent) {
        util.print(
          util.format(
            '\r\033[KUploading %s - %s: %s% complete',
            artist, album, percent
          )
        );
      })
      .on('finish', function() {
        util.print('\n');
      })
      .on('error', function(err) {
        console.error(err);
        process.exit(1);
      });
  });
}
