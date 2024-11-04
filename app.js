// app.js

const recordButton = document.getElementById('recordButton');
const statusDiv = document.getElementById('status');
const responseAudio = document.getElementById('responseAudio');
const chatContainer = document.getElementById('chatContainer');

let mediaRecorder;
let audioChunks = [];

recordButton.addEventListener('mousedown', startRecording);
recordButton.addEventListener('mouseup', stopRecording);

function startRecording() {
    statusDiv.innerText = "Запись...";
    audioChunks = [];
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                addMessage('user', '...'); // Добавляем сообщение пользователя
                sendAudio(audioBlob);
            };
        })
        .catch(error => {
            console.error("Ошибка доступа к микрофону:", error);
            statusDiv.innerText = "Ошибка доступа к микрофону";
        });
}

function stopRecording() {
    statusDiv.innerText = "Отправка...";
    mediaRecorder.stop();
}

function sendAudio(audioBlob) {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
        const base64Audio = reader.result.split(',')[1];
        fetch('ВАШ_WEBHOOK_URL', { // Замените на ваш URL вебхука
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ audio: base64Audio })
        })
        .then(response => response.json())
        .then(data => {
            if (data.audioResponse && data.textResponse) {
                const audioSrc = `data:audio/wav;base64,${data.audioResponse}`;
                responseAudio.src = audioSrc;
                responseAudio.play();
                responseAudio.onended = () => {
                    fetchBotResponseText(data.textResponse); // Добавляем текстовое сообщение бота
                };
                statusDiv.innerText = "Ответ получен";
            } else {
                addMessage('bot', 'Извините, произошла ошибка.');
                statusDiv.innerText = "Ошибка в ответе";
            }
        })
        .catch(error => {
            console.error("Ошибка отправки аудио:", error);
            addMessage('bot', 'Извините, произошла ошибка при отправке.');
            statusDiv.innerText = "Ошибка отправки аудио";
        });
}

function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('bubble');
    bubbleDiv.innerText = text;

    messageDiv.appendChild(bubbleDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function fetchBotResponseText(text) {
    // Добавляем текстовое сообщение бота после воспроизведения аудио
    addMessage('bot', text);
}
