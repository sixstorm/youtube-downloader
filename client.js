function loadLibrary() {
	fetch('/api/files').then((res) => res.json()).then((data) => {
		// Response is title, filename, thumbnail, id in JSON
		// Display images to 'infoSection'
		for (var i = 0; i < data.length; i++) {
			const infoSection = document.getElementById('infoSection');
			const imgObject = document.createElement('img');
			const audioControl = document.createElement('audio');
			audioControl.setAttribute('src', `https://yt.teamtuck.xyz/music/${data.filename}`);
			audioControl.setAttribute('id', `${data.filename}`);
			file.setAttribute('id', 'mediaFile');
			file.setAttribute('alt', data.filename);
			file.src = `http:\\localhost:3000/images/${data.thumbnail}`;
			filesRoot.append(file, audioControl);
			document.body.append(infoSection);
		}

		// Set audio controls
		document.querySelectorAll('img').forEach((item) => {
			item.addEventListener('click', (event) => {
				let fileName = event.target.alt;
				let currentAudioControl = document.querySelector(`audio[id="${fileName}"]`);
				if (currentAudioControl.paused) {
					currentAudioControl.play();
				} else {
					currentAudioControl.pause();
				}
			});
		});
	});
}

function downloadYT() {
	// Get user options and disable the download button until download is complete
	const mp3Button = document.getElementById('mp3radio');
	const mp4Button = document.getElementById('mp4radio');
	const browserDLButton = document.getElementById('browserDL');
	const archiveDLButton = document.getElementById('archiveDL');
	const textbox = document.getElementById('urlText');
	let data;

	// MP3 + Download
	if (mp3Button.checked && browserDLButton.checked) {
		console.log('MP3 + Download');
		data = { url: textbox.value, format: 'mp3', destination: 'browser' };
	}

	// MP4 + Download
	if (mp4Button.checked && browserDLButton.checked) {
		console.log('MP4 + Download');
		data = { url: textbox.value, format: 'mp4', destination: 'browser' };
	}

	// MP3 + Archive
	if (mp3Button.checked && archiveDLButton.checked) {
		console.log('MP3 + Archive');
		data = { url: textbox.value, format: 'mp3', destination: 'archive' };
	}

	// MP4 + Archive
	if (mp4Button.checked && archiveDLButton.checked) {
		console.log('MP4 + Archive');
		data = { url: textbox.value, format: 'mp4', destination: 'archive' };
	}

	// Show "Downloading Now" notification and clear text box
	const dlBar = document.getElementById('dlNotificationBar');
	const dlButton = document.getElementById('dlButton');
	dlButton.disabled = true;
	dlBar.innerHTML = 'Downloading Now...';
	dlBar.style.visibility = 'visible';
	textbox.value = '';

	// Send URL, format and destination to server
	console.log(`Sending data to API`);
	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/JSON'
		},
		body: JSON.stringify(data)
	};

	fetch('/api', options).then((response) => response.json()).then((data) => {
		// Response data is JSON:  filename and title
		// If 'Download Here' selected
		if (data.destination == 'temp') {
			// Display a download link in the DownloadBar
			console.log('Creating a download link');
			//data = JSON.stringify(data);
			let dlBarArea = document.getElementById('dlNotificationBar');
			let dlLink = document.createElement('a');
			dlBarArea.innerHTML = '';
			dlLink.setAttribute('href', data.filename);
			dlLink.setAttribute('download', data.title);
			dlLink.innerHTML = 'Download File';
			dlBarArea.append(dlLink);
			dlButton.disabled = false;
		} else {
			// Display in dlBar that file was saved to archive
			console.log('Archive final message');
			let dlBarArea = document.getElementById('dlNotificationBar');
			let dlAlert = document.createElement('p');
			dlBarArea.innerHTML = '';
			dlAlert.innerHTML = 'File has been successfully downloaded to the archive!';
			dlBarArea.append(dlAlert);
			dlButton.disabled = false;
		}
	});
}
