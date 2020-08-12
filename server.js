const ytdl = require('ytdl-core');
const youtube = require('youtube-dl');
const express = require('express');
const app = express();
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const datastore = require('nedb');

// Load the database
const db = new datastore({ filename: 'database.db', autoload: true });

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
	let videoData;
	let video = ytdl(url, { quality: 'highest' });

	async function getVideoTitle(video) {
		return new Promise((resolve, reject) => {
			video.on('info', (info) => {
				finalTitle = info.videoDetails.title.replace(/[`~!@#$%^*()_|+\=?;:'",.<>\{\}\[\]\\\/]/gi, '');
				finalTitle = finalTitle.replace(/  +/g, ' ');
				console.log(`Attempting to download ${finalTitle}`);
				resolve(finalTitle);
			});
		});
	}

	async function getVideoDuration(video) {
		return new Promise((resolve, reject) => {
			video.on('info', (info) => {
				videoLength = info.videoDetails;
				console.log(`Duration: ${videoLength}`);
				resolve(videoLength);
				reject(console.log('Failed to get video duration'));
			});
		});
	}

	async function MP4VideoDownloadToArchive(video, dest) {
		try {
			finalTitle = await getVideoTitle(video);
			//duration = await getVideoDuration(video);

			video.on('progress', (chunkLength, downloaded, total) => {
				const percent = downloaded / total;
				console.log('Downloading', `${(percent * 100).toFixed(1)}%`);
			});

			video.on('end', () => {
				console.log(`Finished downloading ${finalTitle}`);
				// Log into database
				let start = Date.now();
				// videoData = { title: finalTitle, timestamp: start, duration: videoLength };
				let videoData = { title: finalTitle, timestamp: start, destination: dest, url: url };
				db.insert(videoData); // Save file to server storage
				video.pipe(fs.createWriteStream(`${__dirname}/${dest}/${finalTitle}.mp4`));
				// Send JSON back to client
				console.log('Sending data back to client');
				res.send(JSON.stringify(videoData));
			});
		} catch (error) {
			console.log('Failed to download MP4 video');
		}
	}

	async function MP3AudioDownloadToArchive(video, dest) {
		try {
			console.log('Getting final title');
			finalTitle = await getVideoTitle(video);
			// console.log('Getting duration');
			// duration = await getVideoDuration(video);
			ffmpeg(video).audioBitrate(128).save(`${__dirname}/${dest}/${finalTitle}.mp3`).on('end', (p) => {
				console.log(`Download and conversion is complete!`);
				// Log into database
				let start = Date.now();
				//videoData = { title: finalTitle, timestamp: start, duration: videoLength };
				let videoData = { title: finalTitle, timestamp: start, destination: dest, url: url };
				//videoData = JSON.stringify(videoData);
				console.log(`VideoData: ${videoData}`);
				db.insert(videoData);

				// Send JSON back to client
				console.log('Sending data back to client');
				res.send(JSON.stringify(videoData));
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
		let dest = 'music';
		MP3AudioDownloadToArchive(video, dest);
	}

	// Call function if MP4 + archive
	if (format == 'mp4' && destination == 'archive') {
		console.log('Client requested to download MP4 to archive');
		let dest = 'videos';
		MP4VideoDownloadToArchive(video, dest);
	}

	// Call function if MP3 + download
	if (format == 'mp3' && destination == 'browser') {
		console.log('Client requested to download MP3 to temp/browser');
		let dest = 'temp';
		MP3AudioDownloadToArchive(video, dest);
	}

	// Call function if MP4 + download
	if (format == 'mp4' && destination == 'browser') {
		console.log('Client requested to download MP3 to temp/browser');
		let dest = 'temp';
		MP4VideoDownloadToArchive(video, dest);
	}
});
