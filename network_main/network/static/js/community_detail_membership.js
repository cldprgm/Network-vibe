document.addEventListener('DOMContentLoaded', function () {
    const joinBtn = document.getElementById('join-btn');
    if (!joinBtn) return;

    joinBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const slug = this.dataset.communitySlug;

        fetch(`/communities/${slug}/join`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `community=${slug}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.membership === 'deleted') {
                joinBtn.textContent = 'Join';
                joinBtn.classList.remove('btn-danger');
                joinBtn.classList.add('btn-primary');
            } else if (data.membership === 'created') {
                joinBtn.textContent = 'Leave';
                joinBtn.classList.remove('btn-primary');
                joinBtn.classList.add('btn-danger');
            }
        })
        .catch(error => console.error('Error:', error));
    });
});