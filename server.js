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
	const format = data.format;
	const destination = data.destination;
	console.log(`URL: ${url}, Format: ${format}`);
	let finalTitle;
	let video = ytdl(url, { quality: 'highest' });

	async function getVideoTitle(video) {
		return new Promise((resolve, reject) => {
			video.on('info', (info) => {
				finalTitle = info.videoDetails.title.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
				console.log(`Attempting to download ${finalTitle}`);
				resolve(finalTitle);
			});
		});
	}

	async function MP4VideoDownload(video) {
		try {
			finalTitle = await getVideoTitle(video);

			video.on('progress', (chunkLength, downloaded, total) => {
				console.log(`${chunkLength},${downloaded},${total}`);
				const percent = downloaded / total;
				console.log('Downloading', `${(percent * 100).toFixed(1)}%`);
			});

			video.on('end', () => {
				console.log(`Finished downloading ${finalTitle}`);
				// Display in dlBar that file was saved to archive
				// let dlBarArea = document.getElementById('dlNotificationBar');
				// let dlLink = document.createElement('a');
				// let file = `http://localhost:3000/videos/${finalTitle}.mp4`;
				// dlLink.setAttribute('href', file);
				// dlLink.setAttribute('download', file);
				// dlBarArea.append(dlLink);
				res.send('Download complete!');
			});

			video.pipe(fs.createWriteStream(`${__dirname}/videos/${finalTitle}.mp4`));
		} catch (error) {
			console.log('Failed to download MP4 video');
		}
	}

	async function MP3AudioDownload(video) {
		try {
			finalTitle = await getVideoTitle(video);
			ffmpeg(video).audioBitrate(128).save(`${__dirname}/music/${finalTitle}.mp3`).on('end', (p) => {
				console.log(`Download and conversion is complete!`);
				res.send(`http://localhost:3000/music/${finalTitle}.mp3`);
			});
		} catch (error) {
			console.log('Failed to download MP3 audio');
		}
	}

	// async function downloadConvertMP3(url) {
	// 	try {
	// 		let videoInfo = (url) => {
	// 			return new Promise((resolve, reject) => {
	// 				youtube.getInfo(url, function(err, info) {
	// 					if (err) reject(err);
	// 					resolve(info);
	// 				});
	// 			});
	// 		};

	// 		let videoDownload = (url) => {
	// 			return new Promise((resolve, reject) => {
	// 				const video = ytdl(url, { quality: 'highestaudio' });
	// 				ytdl.getBasicInfo(url).then((info) => {
	// 					const finalTitle = info.videoDetails.title.replace(
	// 						/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi,
	// 						''
	// 					);
	// 					console.log(`Attempting to download video ${finalTitle}`);
	// 					let start = Date.now();
	// 					ffmpeg(video)
	// 						.audioBitrate(128)
	// 						.save(`${__dirname}/music/${finalTitle}.mp3`)
	// 						.on('progress', (p) => {
	// 							readline.cursorTo(process.stdout, 0);
	// 							process.stdout.write(`${p.targetSize}kb downloaded`);
	// 						})
	// 						.on('end', function() {
	// 							console.log('');
	// 							console.log('Download and conversion is complete!');
	// 						});
	// 					resolve(finalTitle);
	// 					reject(console.log('Something went wrong in FFMPEG'));
	// 				});
	// 			});
	// 		};

	// 		videoDownload(url);

	// 		await videoInfo(url)
	// 			.then((info) => {
	// 				// After getting video information, prepare informationt to send back to client
	// 				const finalTitle = info.title.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
	// 				let videoJSON = {
	// 					title: finalTitle,
	// 					filename: `http://localhost:3000/music/${info.title}.mp3`,
	// 					id: info.id
	// 				};
	// 				console.log('Sending JSON back to client');
	// 				console.log(videoJSON);
	// 				res.send(videoJSON);
	// 			})
	// 			.catch((err) => console.error(err));
	// 	} catch (err) {
	// 		console.log(err);
	// 		res.send(JSON.stringify(err));
	// 	}
	// }

	// Call function if MP3 + archive
	if (format == 'mp3' && destination == 'archive') {
		console.log('Client requested to download MP3 to archive');
		MP3AudioDownload(video);
	}

	// Call function if MP4 + archive
	if (format == 'mp4' && destination == 'archive') {
		console.log('Client requested to download MP4 to archive');
		MP4VideoDownload(video);
	}
});
