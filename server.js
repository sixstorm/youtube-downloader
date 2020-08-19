const ytdl = require('ytdl-core');
const youtube = require('youtube-dl');
const express = require('express');
const app = express();
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const datastore = require('nedb');
const moment = require('moment');

// Load the database
const db = new datastore({ filename: 'database.db', autoload: true });

app.listen(3000, () => console.log('Server is online'));
app.use(express.static('./'));
app.use(express.json());

// Serve the stats page
app.get('/stats', (req, res) => {
	res.sendFile('./stats.html', { root: __dirname });
});

app.post('/api', (req, res) => {
	console.log('Received a new video to download');
	const data = req.body;
	const url = data.url;
	const format = data.format;
	const destination = data.destination;
	console.log(`URL: ${url}, Format: ${format}`);
	let finalTitle, videoData, videoAuthor, videoCategory, videoLength, videoLengthMin, videoID;
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

	async function getVideoDetails(url) {
		let videoInfoDetails = ytdl.getInfo(ytdl.getURLVideoID(url)).then((info) => {
			videoTitle = info.videoDetails.title;
			videoAuthor = info.videoDetails.author.name;
			videoCategory = info.videoDetails.category;
			videoLengthMin = (info.videoDetails.lengthSeconds / 60).toFixed(2);
			videoID = info.videoDetails.videoId;
		});
	}

	async function MP4VideoDownloadToArchive(video, dest) {
		try {
			finalTitle = await getVideoTitle(video);
			let details = await getVideoDetails(url);
			let finalFilename = `https://yt.teamtuck.xyz/${dest}/${finalTitle}.mp4`;
			let filename = `${__dirname}/${dest}/${finalTitle}.mp4`;
			let start = Date.now();
			// Check to see if the file exists
			if ((await doesVideoExist(videoID)) && dest != 'temp') {
				// If true, respond with existing file data
				console.log(`${finalTitle}.mp4 already exist, sending info back to client`);
				let videoData = {
					title: finalTitle,
					videoID: videoID,
					timestamp: start,
					destination: dest,
					url: url,
					filename: finalFilename,
					author: videoAuthor,
					category: videoCategory,
					length: videoLengthMin
				};
				res.send(JSON.stringify(videoData));
			} else {
				// If dest is 'videos', save to big storage
				if (dest == 'videos') {
					console.log(`TRYING TO SEND TO BIG STORAGE!!!`);
					filename = `\\\\192.168.50.4\\Youtube\\MP4\\${finalTitle}.mp4`;
					console.log(filename);
				}

				// Save video to file
				console.log(`Video does not exist, downloading now`);
				video.pipe(fs.createWriteStream(filename));
				//video.pipe(fs.createWriteStream(`${__dirname}/${dest}/${finalTitle}.mp4`));

				// Log into database
				let videoData = {
					title: finalTitle,
					videoID: videoID,
					timestamp: start,
					destination: dest,
					url: url,
					filename: filename,
					author: videoAuthor,
					category: videoCategory,
					length: videoLengthMin
				};
				db.insert(videoData);

				// Send JSON back to client
				res.send(JSON.stringify(videoData));
			}
		} catch (error) {
			console.log('Failed to download MP4 video');
			console.log(error);
		}
	}

	async function MP3AudioDownloadToArchive(video, dest) {
		try {
			// Get video title without special characters
			finalTitle = await getVideoTitle(video);
			let filename = `${__dirname}/${dest}/${finalTitle}.mp3`;

			// Get video details
			let details = await getVideoDetails(url);

			// Check to see if file record exists in the database AND if not a direct download
			if ((await doesVideoExist(videoID)) && dest != 'temp') {
				// If true, respond with existing file data
				console.log(`${finalTitle}.mp3 already exist, sending info back to client`);
				let finalFileName = `https://yt.teamtuck.xyz/${dest}/${finalTitle}.mp3`;
				let start = Date.now();
				let videoData = {
					title: finalTitle,
					videoID: videoID,
					timestamp: start,
					destination: dest,
					url: url,
					filename: finalFileName,
					author: videoAuthor,
					category: videoCategory,
					length: videoLengthMin
				};
				console.log('Sending data back to client');

				// Send data back to client
				res.send(JSON.stringify(videoData));
			} else {
				// If dest is 'music', save to big storage
				if (dest == 'music') {
					console.log(`TRYING TO SEND TO BIG STORAGE!!!`);
					filename = `\\\\192.168.50.4\\Youtube\\MP3\\${finalTitle}.mp3`;
					console.log(filename);
				}

				// Download and convert
				console.log(`MP3 does not exist, downloading now`);
				ffmpeg(video).audioBitrate(128).save(filename).on('end', (p) => {
					console.log(`Download and conversion is complete!`);

					// Log into database
					let start = Date.now();
					let finalFileName = `https://yt.teamtuck.xyz/${dest}/${finalTitle}.mp3`;
					let videoData = {
						title: finalTitle,
						videoID: videoID,
						timestamp: start,
						destination: dest,
						url: url,
						filename: finalFileName,
						author: videoAuthor,
						category: videoCategory,
						length: videoLengthMin
					};

					// Insert data into database
					db.insert(videoData);

					// Send JSON back to client
					console.log('Sending data back to client');
					res.send(JSON.stringify(videoData));
				});
			}
		} catch (error) {
			console.log('Failed to download MP3 audio');
			console.log(error);
		}
	}

	function doesVideoExist(ID) {
		return new Promise((resolve, reject) => {
			db.find({ videoID: ID }).exec(function(err, docs) {
				if (err) {
					return reject(err);
				}
				if (docs.length == 0) {
					console.log(`ID ${ID} is not found in the database`);
					return resolve(false);
				} else {
					console.log(`ID ${ID} was found in the database`);
					return resolve(true);
				}
			});
		});
	}

	// async function doesVideoExist(ID) {
	// 	try {
	// 		// Search DB to see if Video ID exist in DB
	// 		console.log(`Looking for ${ID}`);
	// 		db.find({ videoID: ID }).exec(function(err, docs) {
	// 			if (docs.length == 0) {
	// 				console.log(`ID ${ID} is not found in the database`);
	// 				return false;
	// 			} else {
	// 				console.log(`ID ${ID} was found in the database`);
	// 				return true;
	// 			}
	// 		});
	// 	} catch (error) {
	// 		console.log(error);
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

// Stats Data API

app.get('/api/info/lastdownload', (req, res) => {
	db.find({}).sort({ timestamp: -1 }).limit(1).exec(function(err, docs) {
		docs.forEach((element) => {
			element.timestamp = moment(element.timestamp).format('MMMM Do YYYY, h:mm:ss a');
		});

		// Respond with data
		res.send(docs);
	});
});

app.get('/api/totals/mp3', (req, res) => {
	console.log('Getting information for MP3 totals');
	db.find({ filename: /.mp3/ }).exec(function(err, docs) {
		console.log(`Total MP3s: ${docs.length}`);
		if (err) {
			console.log(err);
		}
		res.send(docs);
	});
});

app.get('/api/totals/mp4', (req, res) => {
	console.log('Getting information for MP4 totals');
	db.find({ filename: /.mp4/ }).exec(function(err, docs) {
		console.log(`Total MP4s: ${docs.length}`);
		if (err) {
			console.log(err);
		}
		res.send(docs);
	});
});

app.get('/api/ltd/lastweek', (req, res) => {
	// Define last week and create array skeleton
	let lastWeek = moment().subtract(7, 'days').format('MMMM Do');
	const lastWeekUnix = moment().subtract(7, 'days').unix();
	let dateArray = [
		{
			date: moment().format('MMMM Do'),
			count: 0
		},
		{
			date: moment().subtract(1, 'days').format('MMMM Do'),
			count: 0
		},
		{
			date: moment().subtract(2, 'days').format('MMMM Do'),
			count: 0
		},
		{
			date: moment().subtract(3, 'days').format('MMMM Do'),
			count: 0
		},
		{
			date: moment().subtract(4, 'days').format('MMMM Do'),
			count: 0
		},
		{
			date: moment().subtract(5, 'days').format('MMMM Do'),
			count: 0
		},
		{
			date: moment().subtract(6, 'days').format('MMMM Do'),
			count: 0
		}
	];

	// Run DB query for things greater than last week
	// Go through results and tally up by date to the dateArray
	db.find({ timestamp: { $gt: lastWeekUnix } }).exec(function(err, docs) {
		for (var i = 0; i < docs.length; i++) {
			let convertedTS = moment(docs[i].timestamp).format('MMMM Do');
			for (var j = 0; j < dateArray.length; j++) {
				if (convertedTS == dateArray[j].date) {
					dateArray[j].count++;
				}
			}
		}

		// Send back to client via response
		res.send(dateArray);
	});
});

app.get('/api/ltd/popcat', (req, res) => {
	// DB Query all items and get all categories
	db.find({ category: { $exists: true } }).exec(function(err, docs) {
		// Go through results and grab unique categories
		const catSet = new Set();
		for (var i = 0; i < docs.length; i++) {
			catSet.add(docs[i].category);
		}
		// Convert set to array
		catArray = [ ...catSet ];

		// Category Array Skeleton with unique category name and count
		finalCatArray = [];
		for (var i = 0; i < catArray.length; i++) {
			finalCatArray.push({ category: catArray[i], count: 0 });
		}

		// For each DB query result, find category in finalCatArray and increment
		for (var i = 0; i < docs.length; i++) {
			// Find docs.category from finalCatArray and increment
			foundCat = finalCatArray.find(({ category }) => category === docs[i].category);
			foundCat.count++;
		}

		// Send data back to client
		res.send(finalCatArray);
	});
});
