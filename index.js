const youtube = require('youtube-dl');
const ytdl = require('ytdl-core');
const express = require('express');
const app = express();
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { rejects } = require('assert');
const path = require('path');
const download = require('image-downloader');
const readline = require('readline');

app.listen(3000, () => console.log('Server is online'));
app.use(express.static('./'));
app.use(express.json());

app.get('/api', (req, res) => {
	console.log('Received a GET request');
	res.send('Test back to client');
	// let info = youtube.getInfo(url, function(err, info) {
	// 	const filename = info.title + '.mp3';
	// 	let infoArray = { title: filename };
	// 	res.json(infoArray);
	// });
});

app.get('/api/files', (req, res) => {
	console.log('Client has requested files from server');
	fileArray = [];
	var files = fs.readdirSync('./music');
	for (var i = 0; i < files.length; i++) {
		var filename = files[i];
		if (filename.indexOf('.mp3') >= 0) {
			console.log('Found', filename);
			fileArray.push(filename);
		}
	}
	console.log(fileArray);
	console.log('Sending back array');
	res.send(fileArray);
});

app.post('/api', (req, res) => {
	console.log('Received a request');
	const data = req.body;
	const url = data.url;

	console.log('Trying to get video information...');
	async function getVideoInfo(url) {
		try {
			let videoInfo = (url) => {
				return new Promise((resolve, reject) => {
					youtube.getInfo(url, function(err, info) {
						if (err) reject(err);
						resolve(info);
					});
				});
			};

			await videoInfo(url).then((info) => {
				// Save copy of thumbnail
				const ytURL = 'https://img.youtube.com/vi/';
				const ytArg = '/maxresdefault.jpg';
				const ytThumb = ytURL + info.id + ytArg;
				console.log(`Trying to save ${ytThumb}`);
				options = {
					url: ytThumb,
					dest: `./images/${info.title}.jpg` // will be saved to /path/to/dest/photo.jpg
				};
				download
					.image(options)
					.then(({ filename }) => {
						console.log('Saved to', filename); // saved to /path/to/dest/photo.jpg
						// Prepare JSON to send back to client
						let videoJSON = {
							title: info.title,
							fileName: `http://localhost:3000/music/${info.title}.mp3`,
							thumbnail: `http://localhost:3000/images/${info.title}.jpg`,
							id: info.id
						};
						console.log('Sending back a res');
						console.log(videoJSON);
						res.send(videoJSON);
					})
					.catch((err) => console.error(err));
			});
		} catch (error) {
			console.log(error);
			res.send(JSON.stringify('Something went wrong'));
		}
	}

	getVideoInfo(url);

	// YT Download w/Core
	const video = ytdl(url, { quality: 'highestaudio' });
	ytdl.getBasicInfo(url).then((info) => {
		const title = info.videoDetails.title;
		console.log('Attempting to download file');
		let start = Date.now();
		ffmpeg(video)
			.audioBitrate(128)
			.save(`${__dirname}/music/${title}.mp3`)
			.on('progress', (p) => {
				readline.cursorTo(process.stdout, 0);
				process.stdout.write(`${p.targetSize}kb downloaded`);
			})
			.on('end', () => {
				console.log(`\nAll done! - ${(Date.now() - start) / 1000}s`);
			});
	});
});

function downloadYT(url) {
	console.log('Attempting to download URL:', url);
	youtube.exec(url, [ '-x', '--audio-format', 'mp3', '-o', '%(title)s.%(ext)s' ], {}, (err, output) => {
		if (!err) {
			console.log('Download complete');
		}
	});
}
