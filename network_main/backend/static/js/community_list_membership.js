document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.show-more-btn').forEach(button => {
        button.addEventListener('click', function() {
            const categorySlug = this.getAttribute('data-category');
            const categorySection = this.closest('.category-section');
            const hiddenCommunities = categorySection.querySelectorAll('.d-none');
            
            hiddenCommunities.forEach(el => {
                el.classList.remove('d-none');
            });
            
            this.style.display = 'none';
        });
    });

    document.addEventListener('click', function(event) {
        const button = event.target.closest('.communities-card-body button');
        if (button) {
            event.stopPropagation();
            event.preventDefault();

            const slug = button.dataset.communitySlug;

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
                    button.textContent = 'Join';
                    button.classList.remove('btn-danger', 'custom-community-joined-btn');
                    button.classList.add('btn-primary');
                    button.style.backgroundColor = 'rgb(55, 46, 184)';
                    button.style.borderColor = 'transparent';
                } else if (data.membership === 'created') {
                    button.textContent = 'Joined';
                    button.classList.remove('btn-primary');
                    button.classList.add('btn-danger', 'custom-community-joined-btn');
                    button.style.backgroundColor = '';
                    button.style.borderColor = '';
                }
            })
            .catch(error => console.error('Error:', error));
        }
    });
});