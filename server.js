const ytdl = require('ytdl-core');
const youtube = require('youtube-dl');
const express = require('express');
const app = express();
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const readline = require('readline');

app.listen(3000, () => console.log('Server is online'));
app.use(express.static('./'));
app.use(express.json());

app.post('/api', (req, res) => {
	console.log('Received a new video to download');
	const data = req.body;
	const url = data.url;

	async function downloadConvertMP3(url) {
		try {
			let videoInfo = (url) => {
				return new Promise((resolve, reject) => {
					youtube.getInfo(url, function(err, info) {
						if (err) reject(err);
						resolve(info);
					});
				});
			};

			let videoDownload = (url) => {
				return new Promise((resolve, reject) => {
					const video = ytdl(url, { quality: 'highestaudio' });
					ytdl.getBasicInfo(url).then((info) => {
						const finalTitle = info.videoDetails.title.replace(
							/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi,
							''
						);
						console.log(`Attempting to download video ${finalTitle}`);
						let start = Date.now();
						ffmpeg(video)
							.audioBitrate(128)
							.save(`${__dirname}/music/${finalTitle}.mp3`)
							.on('progress', (p) => {
								readline.cursorTo(process.stdout, 0);
								process.stdout.write(`${p.targetSize}kb downloaded`);
							})
							.on('end', function() {
								console.log('');
								console.log('Download and conversion is complete!');
							});
						resolve(finalTitle);
						reject(console.log('Something went wrong in FFMPEG'));
					});
				});
			};

			videoDownload(url);

			await videoInfo(url)
				.then((info) => {
					// After getting video information, prepare informationt to send back to client
					const finalTitle = info.title.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
					let videoJSON = {
						title: finalTitle,
						filename: `http://localhost:3000/music/${info.title}.mp3`,
						id: info.id
					};
					console.log('Sending JSON back to client');
					console.log(videoJSON);
					res.send(videoJSON);
				})
				.catch((err) => console.error(err));
		} catch (err) {
			console.log(err);
			res.send(JSON.stringify(err));
		}
	}

	// Call function to get video info
	downloadConvertMP3(url);
});
