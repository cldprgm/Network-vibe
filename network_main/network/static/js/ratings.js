const ratingButtons = document.querySelectorAll('.rating-buttons');

ratingButtons.forEach(container => {
    const buttons = container.querySelectorAll('button');
    const ratingSum = container.querySelector('.rating-sum');

    buttons.forEach(button => {
        button.addEventListener('click', event => {
            // Получаем значение рейтинга из data-атрибута кнопки
            const value = parseInt(event.target.dataset.value) || parseInt(event.target.parentElement.dataset.value);
            const postId = parseInt(event.target.dataset.post) || parseInt(event.target.parentElement.dataset.post);
            
            // Создаем объект FormData для отправки данных на сервер
            const formData = new FormData();
            formData.append('post_id', postId);
            formData.append('value', value);

            // Отправляем AJAX-Запрос на сервер
            fetch("/rating/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrftoken,
                    "X-Requested-With": "XMLHttpRequest",
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Обновляем значение рейтинга
                ratingSum.textContent = data.rating_sum;
            })
            .catch(error => console.error(error));
        });
    });
});