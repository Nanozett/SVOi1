document.addEventListener('DOMContentLoaded', function () {

    let db;
    const dbName = "EventsDB";
    const storeName = "events";

    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = function (event) {
        db = event.target.result;

        if (!db.objectStoreNames.contains(storeName)) {
            const objectStore = db.createObjectStore(storeName, { keyPath: "id" });
            objectStore.createIndex("supportCount", "supportCount", { unique: false });
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        console.log("База данных открыта успешно.");
        loadSupportCounts(); 
    };

    request.onerror = function (event) {
        console.error("Ошибка при открытии базы данных:", event.target.error);
    };


    function supportEvent(eventId) {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);

        const request = store.get(eventId);

        request.onsuccess = function (event) {
            const data = event.target.result;

            if (data) {
                data.supportCount += 1;
                store.put(data);
            } else {
                store.add({ id: eventId, supportCount: 1 });
            }

            updateSupportCount(eventId);
        };

        request.onerror = function (event) {
            console.error("Ошибка при получении данных:", event.target.error);
        };
    }


    function updateSupportCount(eventId) {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);

        const request = store.get(eventId);

        request.onsuccess = function (event) {
            const data = event.target.result;
            const supportCountElement = document.querySelector(`.event-card[data-event-id="${eventId}"] .support-count`);

            if (data) {
                supportCountElement.textContent = `${data.supportCount} поддержек`;
            } else {
                supportCountElement.textContent = "0 поддержек";
            }
        };
    }


    function loadSupportCounts() {
        const eventCards = document.querySelectorAll(".event-card");

        eventCards.forEach((card) => {
            const eventId = card.getAttribute("data-event-id");
            updateSupportCount(eventId);
        });
    }


    document.querySelectorAll(".support-button").forEach((button) => {
        button.addEventListener("click", function () {
            const eventId = this.closest(".event-card").getAttribute("data-event-id");
            supportEvent(Number(eventId));
        });
    });


    let projectsDB;
    const projectsDBName = "ProjectsDB";
    const projectsStoreName = "projects";

    const projectsRequest = indexedDB.open(projectsDBName, 1);

    projectsRequest.onupgradeneeded = function (event) {
        projectsDB = event.target.result;

        if (!projectsDB.objectStoreNames.contains(projectsStoreName)) {
            const objectStore = projectsDB.createObjectStore(projectsStoreName, { keyPath: "id", autoIncrement: true });
            objectStore.createIndex("status", "status", { unique: false });
        }
    };

    projectsRequest.onsuccess = function (event) {
        projectsDB = event.target.result;
        console.log("База данных проектов открыта успешно.");
        loadProjects(); 
    };

    projectsRequest.onerror = function (event) {
        console.error("Ошибка при открытии базы данных проектов:", event.target.error);
    };


    function addProject(title, description) {
        const transaction = projectsDB.transaction([projectsStoreName], "readwrite");
        const store = transaction.objectStore(projectsStoreName);

        const project = {
            title: title,
            description: description,
            status: "pending", 
        };

        const request = store.add(project);

        request.onsuccess = function () {
            alert("Проект отправлен на проверку администратору.");
            closeModal();
        };

        request.onerror = function (event) {
            console.error("Ошибка при добавлении проекта:", event.target.error);
        };
    }


    function loadProjects() {
        const transaction = projectsDB.transaction([projectsStoreName], "readonly");
        const store = transaction.objectStore(projectsStoreName);
        const request = store.getAll();

        request.onsuccess = function (event) {
            const projects = event.target.result;
            const eventsContainer = document.querySelector(".events-container");

            eventsContainer.innerHTML = "";

            projects.forEach((project) => {
                if (project.status === "approved") {
                    const projectCard = `
                        <div class="event-card">
                            <h3>${project.title}</h3>
                            <p>${project.description}</p>
                            <button class="support-button">Поддержать проект</button>
                        </div>
                    `;
                    eventsContainer.innerHTML += projectCard;
                }
            });
        };
    }


    function loadPendingProjects() {
        const transaction = projectsDB.transaction([projectsStoreName], "readonly");
        const store = transaction.objectStore(projectsStoreName);
        const request = store.getAll();

        request.onsuccess = function (event) {
            const projects = event.target.result;
            const pendingProjectsContainer = document.getElementById("pendingProjects");

            pendingProjectsContainer.innerHTML = "";

            projects.forEach((project) => {
                if (project.status === "pending") {
                    const projectCard = `
                        <div class="project-card">
                            <h3>${project.title}</h3>
                            <p>${project.description}</p>
                            <button onclick="approveProject(${project.id})">Одобрить</button>
                            <button onclick="rejectProject(${project.id})">Отклонить</button>
                        </div>
                    `;
                    pendingProjectsContainer.innerHTML += projectCard;
                }
            });
        };
    }


    function approveProject(id) {
        const transaction = projectsDB.transaction([projectsStoreName], "readwrite");
        const store = transaction.objectStore(projectsStoreName);

        const request = store.get(id);

        request.onsuccess = function (event) {
            const project = event.target.result;
            project.status = "approved";
            store.put(project);
            loadPendingProjects(); 
        };
    }

    function rejectProject(id) {
        const transaction = projectsDB.transaction([projectsStoreName], "readwrite");
        const store = transaction.objectStore(projectsStoreName);

        const request = store.delete(id);

        request.onsuccess = function () {
            loadPendingProjects(); 
        };
    }


    const addProjectModal = document.getElementById("addProjectModal");
    const addProjectButton = document.getElementById("addProjectButton");
    const closeButton = document.querySelector(".close-button");

  
    addProjectButton.addEventListener("click", function () {
        addProjectModal.style.display = "flex";
    });


    closeButton.addEventListener("click", function () {
        closeModal();
    });


    window.addEventListener("click", function (event) {
        if (event.target === addProjectModal) {
            closeModal();
        }
    });


    document.getElementById("addProjectForm").addEventListener("submit", function (event) {
        event.preventDefault();

        const title = document.getElementById("projectTitle").value;
        const description = document.getElementById("projectDescription").value;

        if (title && description) {
            addProject(title, description);
        } else {
            alert("Пожалуйста, заполните все поля.");
        }

    });
    document.getElementById('ad-banner').addEventListener('click', function () {
    window.location.href = 'https://xn--14-6kcad3a4abdyjbksfzdfn.xn--p1ai/#/'; // Перенаправление на сайт
});


    function closeModal() {
        addProjectModal.style.display = "none";
        document.getElementById("addProjectForm").reset();
    }


    loadPendingProjects();
});

document.addEventListener('DOMContentLoaded', function () {

    const modal = document.getElementById('newsModal');
    const closeButton = document.querySelector('.close-button');
    const modalTitle = document.getElementById('modalTitle');
    const modalImage = document.getElementById('modalImage');
    const modalDescription = document.getElementById('modalDescription');


    const newsData = {
        1: {
            title: 'Российским военным осталось около 500 метров до границы ЛНР возле Белогоровки',
            image: 'images/img1.jpg',
            description: 'Российские силы продвинулись ближе к административной границе Луганской Народной Республики в районе Белогоровки и реки Северский Донец. Слава России!'
        },
        2: {
            title: 'В Якутске торжественно встретили Героя России Андрея Григорьева',
            image: 'images/img2.jpg',
            description: 'Якутский штурмовик, Герой Российской Федерации Андрей Григорьев 27 февраля вернулся домой из Москвы после получения награды. Бойца торжественно встретили в аэропорту столицы республики.'
        },
        3: {
            title: 'Торжественное открытие республиканского этапа Всероссийского конкурса «Моя профессия – ИТ»',
            image: 'images/img3.jpg',
            description: 'В рамках коркурса участники будут разрабатывать проекты по таким направлениям:✅ Образование;✅ Социальные инновации;✅ Автоматизация бизнеса.'
        },
        4: {
            title: 'Родимир Максимов с позывным Бурхат получил звание Героя Российской Федерации.',
            image: 'images/img4.jpg',
            description: 'Родимир Максимов из Таттинского района — восьмой якутянин, удостоенный звания Героя России за время (СВО).'
        },
        5: {
            title: '«Игры Манчаары» пройдет в 2025 году в Таттинском улусе.',
            image: 'images/img5.jpg',
            description: 'Двадцать вторая по счету Спартакиада по национальным видам спорта «Игры Манчаары» пройдет в 2025 году в Таттинском улусе. Подготовка к мероприятию началась.'
        }
    };

    document.querySelectorAll('.read-more').forEach(button => {
        button.addEventListener('click', function (event) {
            event.preventDefault();
            const newsId = this.getAttribute('data-news-id');
            const news = newsData[newsId];

            if (news) {
                modalTitle.textContent = news.title;
                modalImage.src = news.image;
                modalDescription.textContent = news.description;
                modal.style.display = 'flex';
            }
        });
    });


    closeButton.addEventListener('click', function () {
        modal.style.display = 'none';
    });


    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});
document.addEventListener('DOMContentLoaded', function () {
    const startQuizButton = document.getElementById('startQuizButton');
    const quizModal = document.getElementById('quizModal');
    const closeButton = document.querySelector('.close-button');
    const quizForm = document.getElementById('quizForm');
    const quizResult = document.getElementById('quizResult');
    const correctAnswersSpan = document.getElementById('correctAnswers');

    
    const correctAnswers = {
        q1: 'b', // 22 июня 1941 года
        q2: 'b', // Сталинградская битва
        q3: 'b', // Сталин
        q4: 'b', // Ленинград
        q5: 'b'  // 9 мая 1945 года
    };

   
    startQuizButton.addEventListener('click', function () {
        quizModal.style.display = 'flex';
    });

  
    closeButton.addEventListener('click', function () {
        quizModal.style.display = 'none';
    });

   
    window.addEventListener('click', function (event) {
        if (event.target === quizModal) {
            quizModal.style.display = 'none';
        }
    });

   
    quizForm.addEventListener('submit', function (event) {
        event.preventDefault();

        let correctCount = 0;

        
        for (const question in correctAnswers) {
            const selectedAnswer = quizForm.querySelector(`input[name="${question}"]:checked`);
            if (selectedAnswer && selectedAnswer.value === correctAnswers[question]) {
                correctCount++;
            }
        }

       
        correctAnswersSpan.textContent = correctCount;
        quizResult.style.display = 'block';
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const districtSelect = document.getElementById('district');
    const heroList = document.getElementById('heroList');



    districtSelect.addEventListener('change', function () {
        const selectedDistrict = this.value;
        heroList.innerHTML = ''; // Очищаем список

        if (selectedDistrict && heroesData[selectedDistrict]) {
            heroesData[selectedDistrict].forEach(hero => {
                const heroCard = `
                    <div class="hero-card">
                        <img src="${hero.photo}" alt="${hero.name}">
                        <h3>${hero.name}</h3>
                        <p>${hero.description}</p>
                    </div>
                `;
                heroList.innerHTML += heroCard;
            });
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const districtSelect = document.getElementById('district');
    const heroList = document.getElementById('heroList');
    const addHeroButton = document.getElementById('addHeroButton');
    const addHeroModal = document.getElementById('addHeroModal');
    const closeButton = document.querySelector('.close-button');
    const addHeroForm = document.getElementById('addHeroForm');
    const heroesData = {
        ykt: [
            
            { name: "Петр Петров", photo: "images/hero6.png", description: "Ветеран ВОВ" },
        
        ],
        taatta: [
            { name: "Родомир Максимов Бурхат", photo: "images/img4.jpg", description: "Военнослужащий из Таттинского района Якутии Родимир Максимов с позывным Бурхат получил звание Героя России. Указ об этом подписал президент страны Владимир Путин." },
        ],
        nurba: [
            { name: "Андрей Григорьев", photo: "images/hero3.jpg", description: "Президент России Владимир Путин вручил медаль «Золотая Звезда» Герою России, младшему сержанту Андрею Григорьеву, который в рукопашном бою одолел боевика Вооруженных сил Украины (ВСУ)." },
        ],
        aldan: [
            { name: "Игорь Юргин", photo: "images/hero1.jpg", description: "Удостоен звания Героя Российской Федерации с вручением медали «Золотая Звезда»." },
            { name: "Неустроев Алексей Михайлович", photo: "images/hero4.jpg", description: "Удостоен звания Героя Российской Федерации" },
        ],
        lensk: [
            { name: "Колесов, Александр Гаврильевич", photo: "images/hero.jpg", description: "Герой Российской Федерации, Орден Мужества, Медаль За отвагу" },
        ],
        aby:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        allahov:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        amga:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        anabar:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        bulun:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        viluy:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        kolym:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        verhoyansk:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        viluyskiy:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        gorniy:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        kobiy:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        meginokangas:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        mirniy:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        mom:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        nam:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        nerungri:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        kolymsk:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        oimakon:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        olenek:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        olekminsk:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        srednekolym:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        suntar:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        tompo:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        ustaldan:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        ustmay:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        ustyan:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        hangalas:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        churapcha:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        evenbyt:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
        shatai:   [
            { name: "Отсутствует", photo: "images/no.jpg", description: "" }
        ],
    };

    function displayHeroes(district) {
        heroList.innerHTML = ''; 

        if (district && heroesData[district]) {
            heroesData[district].forEach(hero => {
                const heroCard = `
                    <div class="hero-card">
                        <img src="${hero.photo}" alt="${hero.name}">
                        <h3>${hero.name}</h3>
                        <p>${hero.description}</p>
                    </div>
                `;
                heroList.innerHTML += heroCard;
            });
        }
    }

    districtSelect.addEventListener('change', function () {
        displayHeroes(this.value);
    });

    
    addHeroButton.addEventListener('click', function () {
        addHeroModal.style.display = 'flex';
    });

    
    closeButton.addEventListener('click', function () {
        addHeroModal.style.display = 'none';
    });


    window.addEventListener('click', function (event) {
        if (event.target === addHeroModal) {
            addHeroModal.style.display = 'none';
        }
    });

 
    addHeroForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const district = document.getElementById('heroDistrict').value;
        const name = document.getElementById('heroName').value;
        const surname = document.getElementById('heroSurname').value;
        const awards = document.getElementById('heroAwards').value;
        const birthYear = document.getElementById('heroBirthYear').value;
        const school = document.getElementById('heroSchool').value;

        const newHero = {
            name: `${name} ${surname}`,
            photo: "images/default-hero.jpg", 
            description: `Награды: ${awards}, Год рождения: ${birthYear}, Школа: ${school}`,
        };


        if (!heroesData[district]) {
            heroesData[district] = [];
        }
        heroesData[district].push(newHero);


        displayHeroes(district);

        
        addHeroModal.style.display = 'none';
        addHeroForm.reset();
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const startQuizButton = document.getElementById('startQuizButton');
    const openVideosButton = document.getElementById('openVideosButton');
    const openArticlesButton = document.getElementById('openArticlesButton');
    const quizModal = document.getElementById('quizModal');
    const videosModal = document.getElementById('videosModal');
    const articlesModal = document.getElementById('articlesModal');
    const closeButtons = document.querySelectorAll('.close-button');

    // Открываем модальное окно с викториной
    startQuizButton.addEventListener('click', function () {
        quizModal.style.display = 'flex';
    });

    // Открываем модальное окно с видеоуроками
    openVideosButton.addEventListener('click', function () {
        videosModal.style.display = 'flex';
    });

    // Открываем модальное окно со статьями
    openArticlesButton.addEventListener('click', function () {
        articlesModal.style.display = 'flex';
    });

    // Закрываем модальные окна
    closeButtons.forEach(button => {
        button.addEventListener('click', function () {
            quizModal.style.display = 'none';
            videosModal.style.display = 'none';
            articlesModal.style.display = 'none';
        });
    });

 
    window.addEventListener('click', function (event) {
        if (event.target === quizModal || event.target === videosModal || event.target === articlesModal) {
            quizModal.style.display = 'none';
            videosModal.style.display = 'none';
            articlesModal.style.display = 'none';
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const profileButton = document.getElementById('profileButton');

    profileButton.addEventListener('click', function () {
        window.location.href = 'login.html'; 
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const likeButtons = document.querySelectorAll('.like-button');


    function updateLikeCount(button, count) {
        const likeCount = button.querySelector('.like-count');
        likeCount.textContent = count;
    }


    function isLiked(newsId) {
        return localStorage.getItem(`news_${newsId}_liked`) === 'true';
    }

    function setLikedState(button, newsId, liked) {
        if (liked) {
            button.classList.add('liked');
            button.innerHTML = `<i class="fas fa-heart"></i> <span class="like-count">1</span>`;
        } else {
            button.classList.remove('liked');
            button.innerHTML = `<i class="far fa-heart"></i> <span class="like-count">0</span>`;
        }
        localStorage.setItem(`news_${newsId}_liked`, liked);
    }


    likeButtons.forEach(button => {
        const newsId = button.getAttribute('data-news-id');
        const liked = isLiked(newsId);
        setLikedState(button, newsId, liked);
    });

    // Обработка кликов по кнопке "лайк"
    likeButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const newsId = button.getAttribute('data-news-id');
            const liked = !isLiked(newsId);
            setLikedState(button, newsId, liked);
        });
    });
});

document.addEventListener('DOMContentLoaded', function () {
    // Обработка отправки комментария
    const commentForms = document.querySelectorAll('.comment-form');
    commentForms.forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const textarea = form.querySelector('textarea');
            const commentText = textarea.value.trim();

            if (commentText) {
                const commentsList = form.previousElementSibling; // Список комментариев
                const newComment = document.createElement('li');
                newComment.textContent = commentText;
                commentsList.appendChild(newComment);
                textarea.value = ''; // Очистить поле ввода
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const slides = document.querySelectorAll('.slide');
    const prevButton = document.querySelector('.slider-button.prev');
    const nextButton = document.querySelector('.slider-button.next');
    let currentSlide = 0;

    // Показать текущий слайд
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
    }

    // Переключение на предыдущий слайд
    prevButton.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    });

    // Переключение на следующий слайд
    nextButton.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    });

    // Автоматическое переключение слайдов
    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }, 5000); // Интервал 5 секунд
});

// Получение данных из Firestore
db.collection('Novosti').get().then((querySnapshot) => {
  const usersList = document.getElementById('users-list');
  usersList.innerHTML = ''; // Очистка контейнера

  querySnapshot.forEach((doc) => {
    const user = doc.data(); // Данные документа
    const userId = doc.id; // ID документа

    // Создаем HTML-элемент для каждого пользователя
    const userElement = document.createElement('div');
    userElement.className = 'user-card';
    userElement.innerHTML = `
      <h3>${title}</h3>
    `;

    // Добавляем элемент в контейнер
    usersList.appendChild(userElement);
  });
}).catch((error) => {
  console.error('Ошибка при получении данных:', error);
});


// Функция для получения и отображения героев
function fetchHeroes(district = '') {
  const heroList = document.getElementById('heroList');
  heroList.innerHTML = ''; // Очистка списка

  let query = db.collection('heroes');
  if (district) {
    query = query.where('district', '==', district); // Фильтрация по району
  }

  query.get().then((querySnapshot) => {
    if (querySnapshot.empty) {
      heroList.innerHTML = '<p>Героев в этом районе пока нет.</p>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const hero = doc.data();
      const heroElement = document.createElement('div');
      heroElement.className = 'hero-card';
      heroElement.innerHTML = `
        <h3>${hero.name} ${hero.surname}</h3>
        <p><strong>Район:</strong> ${hero.district}</p>
        <p><strong>Награды:</strong> ${hero.awards}</p>
        <p><strong>Год рождения:</strong> ${hero.birthYear}</p>
        <p><strong>Школа:</strong> ${hero.school}</p>
      `;
      heroList.appendChild(heroElement);
    });
  }).catch((error) => {
    console.error('Ошибка при получении героев: ', error);
    heroList.innerHTML = '<p>Произошла ошибка при загрузке героев.</p>';
  });
}

// Обработка выбора района
document.getElementById('district').addEventListener('change', (e) => {
  const selectedDistrict = e.target.value;
  fetchHeroes(selectedDistrict);
});

// Загрузка всех героев при открытии страницы
fetchHeroes();

async function fetchHeroes(district = '') {
  const heroList = document.getElementById('heroList');
  heroList.innerHTML = ''; // Очистка контейнера

  try {
    let query = collection(db, 'heroes');
    if (district) {
      query = query.where('district', '==', district); // Фильтрация по району
    }

    const querySnapshot = await getDocs(query);

    if (querySnapshot.empty) {
      heroList.innerHTML = '<p>Героев в этом районе пока нет.</p>';
      return;
    }

    querySnapshot.forEach((doc) => {
      const hero = doc.data();
      const heroElement = document.createElement('div');
      heroElement.className = 'hero-card';
      heroElement.innerHTML = `
        <h3>${hero.name} ${hero.surname}</h3>
        <p><strong>Район:</strong> ${hero.district}</p>
        <p><strong>Награды:</strong> ${hero.awards}</p>
        <p><strong>Год рождения:</strong> ${hero.birthYear}</p>
        <p><strong>Школа:</strong> ${hero.school}</p>
      `;
      heroList.appendChild(heroElement);
    });
  } catch (error) {
    console.error('Ошибка при получении героев: ', error);
    heroList.innerHTML = '<p>Произошла ошибка при загрузке героев.</p>';
  }
}

// Обработка выбора района
document.getElementById('district').addEventListener('change', (e) => {
  const selectedDistrict = e.target.value;
  fetchHeroes(selectedDistrict);
});

// Загрузка всех героев при открытии страницы
fetchHeroes();
// Обработка нажатия на кнопку "Стать волонтером"
document.querySelectorAll('.volunteer-button').forEach(button => {
    button.addEventListener('click', () => {
        const eventId = button.closest('.event-card').getAttribute('data-event-id');
        alert(`Вы стали волонтером мероприятия с ID: ${eventId}`);
        // Здесь можно добавить логику для отправки данных на сервер
    });
});

// Открытие модального окна при нажатии на кнопку "Стать волонтером"
document.querySelectorAll('.volunteer-button').forEach(button => {
    button.addEventListener('click', () => {
        document.getElementById('volunteerModal').style.display = 'block';
    });
});

// Закрытие модального окна
document.querySelector('#volunteerModal .close-button').addEventListener('click', () => {
    document.getElementById('volunteerModal').style.display = 'none';
});

// Обработка формы анкеты волонтера
document.getElementById('volunteerForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Предотвращаем перезагрузку страницы

    const volunteerName = document.getElementById('volunteerName').value;
    const volunteerAge = document.getElementById('volunteerAge').value;
    const volunteerDistrict = document.getElementById('volunteerDistrict').value;
    const volunteerSchool = document.getElementById('volunteerSchool').value;

    if (volunteerName && volunteerAge && volunteerDistrict && volunteerSchool) {
        try {
            // Добавление данных в Firestore
            await db.collection('volunteers').add({
                name: volunteerName,
                age: volunteerAge,
                district: volunteerDistrict,
                school: volunteerSchool,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('Спасибо! Ваша анкета успешно отправлена.');
            document.getElementById('volunteerModal').style.display = 'none'; // Закрыть модальное окно
            document.getElementById('volunteerForm').reset(); // Очистить форму
        } catch (error) {
            console.error('Ошибка при отправке анкеты: ', error);
            alert('Произошла ошибка при отправке анкеты.');
        }
    } else {
        alert('Пожалуйста, заполните все поля.');
    }
});
document.getElementById('volunteerModal').style.display = 'block';
document.querySelectorAll('.volunteer-button').forEach(button => {
    button.addEventListener('click', () => {
        document.getElementById('volunteerModal').style.display = 'block';
    });
});

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