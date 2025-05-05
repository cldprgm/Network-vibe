function setupRatingButtons(container) {
    const buttons = container.querySelectorAll('button');
    const ratingSum = container.querySelector('.comment-rating-sum');

    const updateButtonStates = (userVote) => {
        buttons.forEach(btn => {
            btn.classList.remove('upvoted', 'downvoted');
            const btnValue = parseInt(btn.dataset.value);
            if (userVote === 1 && btnValue === 1) btn.classList.add('upvoted');
            else if (userVote === -1 && btnValue === -1) btn.classList.add('downvoted');
        });
    };

    buttons.forEach(button => {
        button.addEventListener('click', debounce(event => {
            const target = event.target.tagName === 'IMG' ? event.target.parentElement : event.target;
            const value = parseInt(target.dataset.value);
            const contentTypeId = parseInt(target.dataset.contentType);
            const objectId = parseInt(target.dataset.objectId);

            const formData = new FormData();
            formData.append('content_type_id', contentTypeId);
            formData.append('object_id', objectId);
            formData.append('value', value);

            fetch("/rating/create/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": csrftoken,
                    "X-Requested-With": "XMLHttpRequest"
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'error') throw new Error(data.message);
                ratingSum.textContent = data.rating_sum;
                updateButtonStates(data.user_vote);
            })
            .catch(error => {
                console.error("Error updating rating:", error);
                alert("Failed to update rating.");
            });
        }, 200));
    });
}

// Batch fetch ratings for all comments
const commentRatingButtons = document.querySelectorAll('.comment-rating-buttons');
const commentObjectIds = [];
let commentContentTypeId;

commentRatingButtons.forEach(container => {
    const button = container.querySelector('button');
    commentObjectIds.push(button.dataset.objectId);
    commentContentTypeId = button.dataset.contentType;
});

fetch(`/rating/status/?content_type=${commentContentTypeId}&object_ids=${commentObjectIds.join('&object_ids=')}`, {
    headers: {"X-Requested-With": "XMLHttpRequest"}
})
.then(response => {
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return response.json();
})
.then(data => {
    commentRatingButtons.forEach(container => {
        const buttons = container.querySelectorAll('button');
        const ratingSum = container.querySelector('.comment-rating-sum');
        const objectId = buttons[0].dataset.objectId;

        setupRatingButtons(container); // Setup click handlers
        const updateButtonStates = (userVote) => {
            buttons.forEach(btn => {
                btn.classList.remove('upvoted', 'downvoted');
                const btnValue = parseInt(btn.dataset.value);
                if (userVote === 1 && btnValue === 1) btn.classList.add('upvoted');
                else if (userVote === -1 && btnValue === -1) btn.classList.add('downvoted');
            });
        };
        updateButtonStates(data[objectId].user_vote);
        ratingSum.textContent = data[objectId].rating_sum;
    });
})
.catch(error => {
    console.error("Error initializing comment ratings:", error);
    commentRatingButtons.forEach(container => {
        container.querySelector('.comment-rating-sum').textContent = "N/A";
    });
});

// Comment form handling (unchanged)
const commentForm = document.forms.commentForm;
const commentFormContent = commentForm.content;
const commentFormParentInput = commentForm.parent;
const commentFormSubmit = commentForm.commentSubmit;
const commentPostId = commentForm.getAttribute('data-post-id');

commentForm.addEventListener('submit', createComment);

replyUser();

function replyUser() {
    document.querySelectorAll('.btn-reply').forEach(e => {
        e.addEventListener('click', replyComment);
    });
}

function replyComment() {
    const commentUsername = this.getAttribute('data-comment-username');
    const commentMessageId = this.getAttribute('data-comment-id');
    commentFormContent.value = `${commentUsername}, `;
    commentFormParentInput.value = commentMessageId;
}

async function createComment(event) {
    event.preventDefault();
    commentFormSubmit.disabled = true;
    commentFormSubmit.innerText = "Waiting for the server response";
    try {
        const response = await fetch(`/post/${commentPostId}/comments/create/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: new FormData(commentForm)
        });

        if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);
        const comment = await response.json();

        let commentTemplate = `
            <ul id="comment-thread-${comment.id}" style="margin-top: 0; margin-bottom: 0;">
                <li class="card border-0 text-white bg-dark">
                    <div class="row">
                        <h6 class="text-white d-flex">
                            <img src="${comment.avatar}" class="rounded-circle" alt="${comment.author}" width="40" height="40">
                            <div class="ms-2 d-flex flex-column mt-2" style="max-width: 100%;">
                                <div>
                                    <a class="custom-a fw-bold" href="${comment.get_absolute_url}">${comment.author}</a>
                                    <span style="color: rgba(255, 255, 255, 0.75);">• ${comment.time_created}</span>
                                </div>
                                <div class="mt-2" style="word-wrap: break-word; overflow-wrap: break-word; white-space: normal; max-width: 100%;">
                                    ${comment.content}
                                </div>
                            </div>
                        </h6>
                        <div class="col-md-12">
                            <div class="card-body">
                                <div class="comment-toolbar">
                                    <div class="comment-rating-buttons ms-2 mb-1">
                                        <button class="btn btn-sm btn-secondary rounded-circle border-0" 
                                                data-content-type="${contentTypes.comment}" 
                                                data-object-id="${comment.id}" 
                                                data-value="1">
                                            <img src="/static/icons/upvote.svg" 
                                                 data-content-type="${contentTypes.comment}" 
                                                 data-object-id="${comment.id}" 
                                                 data-value="1" 
                                                 width="16" height="16" 
                                                 style="filter: invert(0.7);">
                                        </button>
                                        <span class="comment-rating-sum">0</span>
                                        <button class="btn btn-sm btn-secondary rounded-circle border-0" 
                                                data-content-type="${contentTypes.comment}" 
                                                data-object-id="${comment.id}" 
                                                data-value="-1">
                                            <img src="/static/icons/downvote.svg" 
                                                 data-content-type="${contentTypes.comment}" 
                                                 data-object-id="${comment.id}" 
                                                 data-value="-1" 
                                                 width="16" height="16" 
                                                 style="filter: invert(0.7);">
                                        </button>                                        
                                    </div>
                                    <a class="comment-toolbar-button btn-reply mb-1" 
                                        href="#commentForm" 
                                        data-comment-id="${comment.pk}" 
                                        data-comment-username="${comment.author}">
                                        <img src="/static/icons/comment.svg" width="16" height="16" style="filter: invert(0.7);">
                                        Reply
                                    </a>
                                    <a href="#" class="comment-toolbar-button mb-1">              
                                        <img src="/static/icons/share.svg" width="22" height="22" style="filter: invert(0.7);">
                                        Share
                                    </a>
                                    <a href="#" class="comment-toolbar-button mb-1">
                                        <img src="/static/icons/ellipsis.svg" width="20" height="20" style="filter: invert(0.7);">
                                    </a>
                                </div>
                                <hr style="width: 38rem; margin: 0.40rem 0;">
                            </div>
                        </div>
                    </div>
                </li>
            </ul>
        `;

        if (comment.is_child) {
            let parentThread = document.querySelector(`#comment-thread-${comment.parent_id}`);
            if (parentThread) {
                let parentLi = parentThread.querySelector('li');
                if (parentLi) parentLi.insertAdjacentHTML("afterend", commentTemplate);
            }
        } else {
            let nestedComments = document.querySelector('.nested-comments');
            if (nestedComments) nestedComments.insertAdjacentHTML("afterbegin", commentTemplate);
        }

        const newCommentThread = document.querySelector(`#comment-thread-${comment.id}`);
        if (newCommentThread) {
            const newRatingButtons = newCommentThread.querySelector('.comment-rating-buttons');
            if (newRatingButtons) setupRatingButtons(newRatingButtons);
        }

        commentForm.reset();
        commentFormParentInput.value = "";
    } catch (error) {
        console.error("Error adding comment:", error);
        alert("Failed to add comment.");
    } finally {
        commentFormSubmit.disabled = false;
        commentFormSubmit.innerText = "Add comment";
    }

    replyUser();
}