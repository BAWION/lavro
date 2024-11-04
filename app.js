const recordButton = document.getElementById('recordButton');
const statusDiv = document.getElementById('status');
let mediaRecorder;
let audioChunks = [];

// Обработчики событий для кнопки записи
recordButton.addEventListener('mousedown', startRecording);
recordButton.addEventListener('mouseup', stopRecording);
recordButton.addEventListener('touchstart', startRecording); // Для мобильных устройств
recordButton.addEventListener('touchend', stopRecording);    // Для мобильных устройств

function startRecording() {
    statusDiv.innerText = "Запись...";
    audioChunks = [];

    // Проверка наличия доступа к микрофону
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                sendAudio(audioBlob);
            };
        })
        .catch(error => {
            console.error("Ошибка доступа к микрофону:", error);
            statusDiv.innerText = "Ошибка доступа к микрофону. Проверьте разрешения.";
        });
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

function sendAudio(audioBlob) {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
        const base64Audio = reader.result.split(',')[1];
        fetch('https://hook.us2.make.com/cuh6lv356p24ronyxfj8y6xko82naw9p', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ audio: base64Audio })
        })
        .then(response => response.json())
        .then(data => {
            statusDiv.innerText = "Ответ получен";
            // Здесь можно добавить обработку ответа и воспроизведение аудио
        })
        .catch(error => {
            console.error("Ошибка отправки аудио:", error);
            statusDiv.innerText = "Ошибка отправки аудио.";
        });
    };
}
