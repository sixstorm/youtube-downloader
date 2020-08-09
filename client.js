function loadLibrary() {
	fetch('/api/files').then((res) => res.json()).then((data) => {
		// Response is title, filename, thumbnail, id in JSON
		// Display images to 'infoSection'
		for (var i = 0; i < data.length; i++) {
			const infoSection = document.getElementById('infoSection');
			const imgObject = document.createElement('img');
			const audioControl = document.createElement('audio');
			audioControl.setAttribute('src', `http://localhost:3000/music/${data.filename}`);
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
	// Show "Downloading Now" notification and clear text box
	const dlBar = document.getElementById('dlNotificationBar');
	dlBar.innerHTML = 'Downloading Now...';
	dlBar.style.visibility = 'visible';
	const textbox = document.getElementById('urlText');
	const data = { url: textbox.value };
	const jsonData = JSON.stringify(data);
	console.log(jsonData);
	textbox.value = '';

	// Send URL to Server
	console.log(`Sending data to API`);
	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/JSON'
		},
		body: jsonData
	};

	fetch('/api', options).then((response) => response.json()).then((data) => {
		console.log(data);
		dlBar.style.visibility = 'hidden';
		console.log('Download complete!');
	});
}
