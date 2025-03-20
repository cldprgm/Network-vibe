// Получаем все контейнеры с кнопками рейтинга
const ratingButtons = document.querySelectorAll('.post-rating-buttons');

ratingButtons.forEach(container => {
    const buttons = container.querySelectorAll('button');
    const ratingSum = container.querySelector('.post-rating-sum');

    // Функция для обновления состояния кнопок
    const updateButtonStates = (userVote) => {
        buttons.forEach(btn => {
            btn.classList.remove('upvoted', 'downvoted');
            const btnValue = parseInt(btn.dataset.value);
            if (userVote === 1 && btnValue === 1) {
                btn.classList.add('upvoted');
            } else if (userVote === -1 && btnValue === -1) {
                btn.classList.add('downvoted');
            }
        });
    };

    // Обработчик кликов с debounce
    buttons.forEach(button => {
        button.addEventListener('click', debounce(event => {
            // Определяем, была ли нажата кнопка или изображение внутри неё
            const target = event.target.tagName === 'IMG' ? event.target.parentElement : event.target;
            const value = parseInt(target.dataset.value);
            const contentTypeId = parseInt(target.dataset.contentType);
            const objectId = parseInt(target.dataset.objectId);

            // Создаем данные для отправки
            const formData = new FormData();
            formData.append('content_type_id', contentTypeId);
            formData.append('object_id', objectId);
            formData.append('value', value);

            // Отправляем запрос на сервер
            fetch("/rating/create/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrftoken, // Предполагается, что csrftoken определён глобально
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Ответ сервера:", data); // Для отладки
                if (data.status === 'error') {
                    throw new Error(data.message);
                }
                // Обновляем сумму рейтинга и состояние кнопок
                ratingSum.textContent = data.rating_sum;
                updateButtonStates(data.user_vote);
            })
            .catch(error => {
                console.error("Ошибка при обновлении рейтинга:", error);
                alert("Произошла ошибка при обновлении рейтинга. Попробуйте позже.");
            });
        }, 200)); // Задержка 300 мс для debounce
    });

    // Инициализация состояния при загрузке страницы
    fetch(`/rating/status/?content_type=${buttons[0].dataset.contentType}&object_id=${buttons[0].dataset.objectId}`, {
        headers: {
            "X-Requested-With": "XMLHttpRequest",
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Инициализация:", data); // Для отладки
        if (data.error) {
            throw new Error(data.error);
        }
        // Устанавливаем начальное состояние кнопок и сумму рейтинга
        updateButtonStates(data.user_vote);
        ratingSum.textContent = data.rating_sum;
    })
    .catch(error => {
        console.error("Ошибка при инициализации рейтинга:", error);
        ratingSum.textContent = "N/A"; // Показываем заглушку в случае ошибки
    });
});