// Получение элементов из DOM
const recordButton = document.getElementById('recordButton');
const statusDiv = document.getElementById('status');
const responseAudio = document.getElementById('responseAudio');
const chatContainer = document.getElementById('chatContainer');
const loadingDiv = document.getElementById('loading');

let mediaRecorder;
let audioChunks = [];

// Добавляем обработчики событий для кнопки записи
recordButton.addEventListener('mousedown', startRecording);
recordButton.addEventListener('mouseup', stopRecording);
recordButton.addEventListener('touchstart', startRecording); // Для мобильных устройств
recordButton.addEventListener('touchend', stopRecording);    // Для мобильных устройств

// Функция начала записи
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
                addMessage('user', '...'); // Добавляем сообщение пользователя с многоточием
                sendAudio(audioBlob);
            };
        })
        .catch(error => {
            console.error("Ошибка доступа к микрофону:", error);
            statusDiv.innerText = "Ошибка доступа к микрофону. Проверьте разрешения.";
        });
}

// Функция остановки записи
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

// Функция отправки аудио на вебхук Make.com
function sendAudio(audioBlob) {
    startLoading();
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    // Отправляем запрос на вебхук Make.com
    fetch('https://hook.us2.make.com/cuh6lv356p24ronyxfj8y6xko82naw9p', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        stopLoading();
        if (data.audioResponse && data.textResponse) {
            const audioSrc = `data:audio/wav;base64,${data.audioResponse}`;
            responseAudio.src = audioSrc;
            responseAudio.play();
            responseAudio.onended = () => {
                addMessage('bot', data.textResponse); // Добавляем текстовое сообщение бота после воспроизведения аудио
            };
            statusDiv.innerText = "Ответ получен";
        } else {
            addMessage('bot', 'Извините, произошла ошибка.');
            statusDiv.innerText = "Ошибка в ответе";
        }
    })
    .catch(error => {
        console.error("Ошибка отправки аудио:", error);
        statusDiv.innerText = "Ошибка отправки аудио.";
    });
}

// Функция добавления сообщения в чат
function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('bubble');
    bubbleDiv.innerText = text;

    messageDiv.appendChild(bubbleDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Сохранение в localStorage
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    chatHistory.push({ sender, text });
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// Функция загрузки истории чата при загрузке страницы
window.onload = () => {
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    chatHistory.forEach(message => {
        addMessage(message.sender, message.text);
    });
}

// Функции для управления индикатором загрузки
function startLoading() {
    loadingDiv.style.display = 'block';
}

function stopLoading() {
    loadingDiv.style.display = 'none';
}
