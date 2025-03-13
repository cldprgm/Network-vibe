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

        let commentTemplate = `<ul id="comment-thread-${comment.id}">
                                <li class="card border-0 text-white bg-dark">
                                    <div class="row">
                                        <div class="col-md-2">
                                            <img src="${comment.avatar}" style="width: 120px;height: 120px;object-fit: cover;" alt="${comment.author}"/>
                                        </div>
                                        <div class="col-md-10">
                                            <div class="card-body">
                                                <h6 class="card-title">
                                                    <a href="${comment.get_absolute_url}">${comment.author}</a>
                                                </h6>
                                                <p class="card-text">
                                                    ${comment.content}
                                                </p>
                                                <a class="btn bg-white btn-sm btn-reply" href="#commentForm" data-comment-id="${comment.id}" data-comment-username="${comment.author}">Reply</a>
                                                <hr/>
                                                <time>${comment.time_created}</time>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>`;
        
        if (comment.is_child) {
            let parentThread = document.querySelector(`#comment-thread-${comment.parent_id}`);
            if (parentThread) {
                parentThread.insertAdjacentHTML("beforeend", commentTemplate);
            } else {
                console.error("Не найден родительский комментарий", comment.parent_id);
                alert("Не найден родительский комментарий")
                alert(comment.parent_id)
            }
        } else {
            let nestedComments = document.querySelector('.nested-comments');
            if (nestedComments) {
                nestedComments.insertAdjacentHTML("beforeend", commentTemplate);
            } else {
                console.error("Не найден контейнер .nested-comments");
                alert("Не найден контейнер .nested-comments")
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
