// app.js

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
    startLoading();
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
            statusDiv.innerText = "Ошибка доступа к микрофону";
            stopLoading();
        });
}

// Функция остановки записи
function stopRecording() {
    statusDiv.innerText = "Отправка...";
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

// Функция отправки аудио на вебхук Make.com
function sendAudio(audioBlob) {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
        const base64Audio = reader.result.split(',')[1];
        fetch('https://hook.us2.make.com/cuh6lv356p24ronyxfj8y6xko82naw9p', { // Ваш URL вебхука
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                audio: base64Audio
            })
        })
        .then(response => response.json())
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
            addMessage('bot', 'Извините, произошла ошибка при отправке.');
            statusDiv.innerText = "Ошибка отправки аудио";
            stopLoading();
        });
}

// Функция добавления сообщения в чат
function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('bubble');
    bubbleDiv.innerText = text;

    // Если у вас есть аватары, добавьте их здесь
    /*
    const avatarImg = document.createElement('img');
    avatarImg.classList.add('avatar');
    avatarImg.src = sender === 'user' ? 'user-avatar.png' : 'bot-avatar.png';
    avatarImg.alt = sender === 'user' ? 'User' : 'Bot';
    messageDiv.appendChild(avatarImg);
    */

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
