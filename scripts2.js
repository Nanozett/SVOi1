// Открытие модального окна с историей ВОВ
document.getElementById('openHistoryButton').addEventListener('click', function() {
    document.getElementById('historyModal').style.display = 'flex';
});

// Закрытие модального окна
document.querySelectorAll('.close-button').forEach(function(button) {
    button.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});

// Закрытие модального окна при клике вне его
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});


// Функция для открытия модального окна
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

// Функция для закрытия модального окна
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Обработчики для кнопок
document.getElementById('startQuizButton').addEventListener('click', function() {
    openModal('quizModal');
});

document.getElementById('openVideosButton').addEventListener('click', function() {
    openModal('videosModal');
});

document.getElementById('openArticlesButton').addEventListener('click', function() {
    openModal('articlesModal');
});

// Закрытие модальных окон при нажатии на кнопку закрытия
document.querySelectorAll('.close-button').forEach(function(button) {
    button.addEventListener('click', function() {
        closeModal(this.closest('.modal').id);
    });
});

// Закрытие модальных окон при клике вне их области
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
});

// Открытие модального окна с историей СВО
document.getElementById('openSVOButton').addEventListener('click', function() {
    document.getElementById('svoModal').style.display = 'flex';
});

// Закрытие модального окна
document.querySelectorAll('.close-button').forEach(function(button) {
    button.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});

// Закрытие модального окна при клике вне его
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});