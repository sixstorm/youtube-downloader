function getDBInfo() {
	// Get latest download
	fetch('/api/info/lastdownload').then((response) => response.json()).then((resData) => {
		console.log(resData);

		for (var i = 0; i < resData.length; i++) {
			const videoInfoSection = document.getElementById('lastDownloadSection');
			const newVideo = document.createElement('div');
			const videoTitle = document.createElement('a');
			const videoAuthor = document.createElement('div');

			newVideo.setAttribute('id', 'newVideo');

			videoTitle.innerHTML = resData[i].title;
			videoTitle.setAttribute('href', resData[i].url);
			if (resData[i].author) {
				videoAuthor.innerHTML = resData[i].author;
			} else {
				videoAuthor.innerHTML = 'unknown';
			}
			newVideo.append(videoTitle, videoAuthor);
			videoInfoSection.append(newVideo);
		}
	});

	// Get MP3 totals
	fetch('/api/totals/mp3').then((response) => response.json()).then((totalData) => {
		let mp3Section = document.getElementById('mp3TotalSection');
		let mp3Count = document.createElement('p');
		mp3Count.setAttribute('id', 'fileCount');
		mp3Count.innerHTML = totalData.length;
		mp3Section.append(mp3Count);
	});

	// Get MP4 totals
	fetch('/api/totals/mp4').then((response) => response.json()).then((totalData) => {
		let mp4Section = document.getElementById('mp4TotalSection');
		let mp4Count = document.createElement('p');
		mp4Count.setAttribute('id', 'fileCount');
		mp4Count.innerHTML = totalData.length;
		mp4Section.append(mp4Count);
	});
}

function getLastWeekChartData() {
	// Get last week's download data
	fetch('/api/ltd/lastweek').then((response) =>
		response.json().then((lastWeekData) => {
			console.log(lastWeekData);

			// Chart JS Stuff
			// Y Axis:  Amount of Downloads
			// X Axis:  7 Days of the Past Week

			// Split array into datesArray and dlArray
			let datesArray = [];
			let dlArray = [];

			for (var i = 0; i < lastWeekData.length; i++) {
				datesArray.push(lastWeekData[i].date);
				dlArray.push(lastWeekData[i].count);
			}

			datesArray.reverse();
			dlArray.reverse();

			new Chart(document.getElementById('dlHistory'), {
				type: 'bar',
				data: {
					labels: datesArray,
					datasets: [
						{
							label: 'Downloads',
							data: dlArray,
							backgroundColor: [ '#2a9d8f', '#e9c46a', '#f4a261', '#3d5a80', '#98c1d9', '#ee6c4d' ]
						}
					]
				}
			});
		})
	);
}

function getPopularCategoryData() {
	// Get category data for doughnut chart
	fetch('/api/ltd/popcat').then((response) =>
		response.json().then((popcatData) => {
			console.log(popcatData);

			// Chart JS Stuff

			// Split Categories and Counts into separate arrays
			catArray = [];
			countsArray = [];

			for (var i = 0; i < popcatData.length; i++) {
				catArray.push(popcatData[i].category);
				countsArray.push(popcatData[i].count);
			}

			new Chart(document.getElementById('popDoughnut'), {
				type: 'doughnut',
				data: {
					labels: catArray,
					datasets: [
						{
							label: 'Counts',
							data: countsArray,
							backgroundColor: [ '#2a9d8f', '#e9c46a', '#f4a261', '#3d5a80', '#98c1d9', '#ee6c4d' ]
						}
					]
				}
			});
		})
	);
}

// Call functions to grab data

getDBInfo();
getLastWeekChartData();
getPopularCategoryData();
