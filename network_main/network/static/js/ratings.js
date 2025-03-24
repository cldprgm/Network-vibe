// Собираем все object_id и content_type из постов
const ratingButtons = document.querySelectorAll('.post-rating-buttons');
const objectIds = [];
let contentTypeId;

ratingButtons.forEach(container => {
    const button = container.querySelector('button');
    objectIds.push(button.dataset.objectId);
    contentTypeId = button.dataset.contentType; // Предполагаем, что одинаковый для всех
});

// Один запрос для всех рейтингов
fetch(`/rating/status/?content_type=${contentTypeId}&object_ids=${objectIds.join('&object_ids=')}`, {
    headers: {
        "X-Requested-With": "XMLHttpRequest",
    }
})
.then(response => {
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return response.json();
})
.then(data => {
    console.log("Batch data:", data);
    if (data.error) throw new Error(data.error);

    ratingButtons.forEach(container => {
        const buttons = container.querySelectorAll('button');
        const ratingSum = container.querySelector('.post-rating-sum');
        const objectId = buttons[0].dataset.objectId;

        const updateButtonStates = (userVote) => {
            buttons.forEach(btn => {
                btn.classList.remove('upvoted', 'downvoted');
                const btnValue = parseInt(btn.dataset.value);
                if (userVote === 1 && btnValue === 1) btn.classList.add('upvoted');
                else if (userVote === -1 && btnValue === -1) btn.classList.add('downvoted');
            });
        };

        // Устанавливаем начальные значения
        updateButtonStates(data[objectId].user_vote);
        ratingSum.textContent = data[objectId].rating_sum;

        // Обработчик кликов
        buttons.forEach(button => {
            button.addEventListener('click', debounce(event => {
                const target = event.target.tagName === 'IMG' ? event.target.parentElement : event.target;
                const value = parseInt(target.dataset.value);
                const formData = new FormData();
                formData.append('content_type_id', contentTypeId);
                formData.append('object_id', objectId);
                formData.append('value', value);

                fetch("/rating/create/", {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrftoken,
                        "X-Requested-With": "XMLHttpRequest",
                    },
                    body: formData
                })
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    if (data.status === 'error') throw new Error(data.message);
                    ratingSum.textContent = data.rating_sum;
                    updateButtonStates(data.user_vote);
                })
                .catch(error => {
                    console.error("Ошибка:", error);
                    alert("Ошибка при обновлении рейтинга.");
                });
            }, 200));
        });
    });
})
.catch(error => {
    console.error("Ошибка инициализации:", error);
    ratingButtons.forEach(container => {
        container.querySelector('.post-rating-sum').textContent = "N/A";
    });
});