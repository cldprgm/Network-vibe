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
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: new FormData(commentForm),
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
        }
        
        const comment = await response.json();

        let commentTemplate = `<ul id="comment-thread-${comment.id}" style="margin-top: 0; margin-bottom: 0;">
                                    <li class="card border-0 text-white bg-dark">
                                        <div class="row">
                                            <h6 class="text-white d-flex">
                                                <img
                                                src="${comment.avatar}"
                                                class="rounded-circle"
                                                alt="${comment.author}"
                                                width="40"
                                                height="40"
                                                >
                                                <div class="ms-2 d-flex flex-column mt-2" style="max-width: 100%;">
                                                    <div>
                                                        <a
                                                        class="custom-a fw-bold"
                                                        href="${comment.get_absolute_url}">
                                                        ${comment.author}
                                                        </a>
                                                        <span style="color: rgba(255, 255, 255, 0.75);">• ${comment.time_created}</span>
                                                    </div>
                                                    <div class="mt-2" style="word-wrap: break-word; overflow-wrap: break-word; white-space: normal; max-width: 100%;">
                                                        ${comment.content}
                                                    </div>
                                                </div>
                                            </h6>
                                            <div class="col-md-12">
                                                <div class="card-body">
                                                    <a class="btn bg-white btn-sm btn-reply rounded-4 border-0" href="#commentForm" data-comment-id="${comment.id}" data-comment-username="${comment.author}">Reply</a>
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
                if (parentLi) {
                    parentLi.insertAdjacentHTML("afterend", commentTemplate);
                } else {
                    console.error("Не найдена <li> в родительском комментарии");
                }
            } else {
                console.error("Не найден родительский комментарий", comment.parent_id);
                alert("Не найден родительский комментарий");
                alert(comment.parent_id);
            }
        } else {
            let nestedComments = document.querySelector('.nested-comments');
            if (nestedComments) {
                nestedComments.insertAdjacentHTML("afterbegin", commentTemplate);
            } else {
                console.error("Не найден контейнер .nested-comments");
                alert("Не найден контейнер .nested-comments");
            }
        }
        
        commentForm.reset();
        commentFormParentInput.value = "";
    } catch (error) {
        console.error("Ошибка при отправке комментария:", error);
        alert("Произошла ошибка при добавлении комментария. Попробуйте снова.");
        alert(error);
    } finally {
        commentFormSubmit.disabled = false;
        commentFormSubmit.innerText = "Add comment";
    }
    
    replyUser();
}