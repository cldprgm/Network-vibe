from django.shortcuts import render, redirect
from django.views.generic import ListView, DetailView, CreateView, UpdateView, View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.messages.views import SuccessMessageMixin
from django.db.models import Prefetch
from django.db import transaction
from django.urls import reverse_lazy
from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.contenttypes.models import ContentType


from .models import Post, Category, Media, Comment, Rating
from .forms import PostCreateForm, MediaFormSet, CommentCreateForm
from ..services.mixins import AuthorRequiredMixin


class PostListView(ListView):
    model = Post
    template_name = 'social_network/post_list.html'
    context_object_name = 'posts'

    def get_queryset(self):
        return Post.published.prefetch_related('media')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = 'Main page'
        context['post_content_type'] = ContentType.objects.get_for_model(
            Post).id
        return context


class PostDetailView(DetailView):
    model = Post
    template_name = 'social_network/post_detail.html'
    context_object_name = 'post'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = self.object.title
        context["form"] = CommentCreateForm
        context['post_content_type'] = ContentType.objects.get_for_model(
            Post).id
        context['comment_content_type'] = ContentType.objects.get_for_model(
            Comment).id
        return context


class PostFromCategory(ListView):
    template_name = 'social_network/post_list.html'
    context_object_name = 'posts'
    category = None

    def get_queryset(self):
        self.category = Category.objects.get(slug=self.kwargs['slug'])
        queryset = Post.published.filter(category__slug=self.category.slug)
        if not queryset:
            sub_cat = Category.objects.filter(parent=self.category)
            queryset = Post.published.filter(category__in=sub_cat)
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = f'Posts from the category: {self.category.title}'
        return context


class PostCreateView(LoginRequiredMixin, SuccessMessageMixin, CreateView):
    model = Post
    template_name = 'social_network/post_create.html'
    form_class = PostCreateForm
    success_message = 'Successfully created'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = 'Add a post'
        if self.request.POST:
            context['media_formset'] = MediaFormSet(
                self.request.POST, self.request.FILES)
        else:
            context['media_formset'] = MediaFormSet()
        return context

    def form_valid(self, form):
        context = self.get_context_data()
        media_formset = context['media_formset']
        if media_formset.is_valid():
            self.object = form.save(commit=False)
            self.object.author = self.request.user
            self.object.save()
            media_formset.instance = self.object
            media_formset.save()
            return super().form_valid(form)
        else:
            return self.form_invalid(form)

    def get_success_url(self):
        return self.object.get_absolute_url()


class PostUpdateView(AuthorRequiredMixin, SuccessMessageMixin, UpdateView):
    model = Post
    template_name = 'social_network/post_update.html'
    context_object_name = 'post'
    form_class = PostCreateForm
    login_url = 'home'
    success_message = 'Successfully updated'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = f'Editing a post: {self.object.title}'
        if self.request.POST:
            context['media_formset'] = MediaFormSet(
                self.request.POST, self.request.FILES, instance=self.object)
        else:
            context['media_formset'] = MediaFormSet(instance=self.object)
        return context

    def form_valid(self, form):
        context = self.get_context_data()
        media_formset = context['media_formset']

        if media_formset.is_valid():
            self.object = form.save()
            media_formset.instance = self.object
            media_formset.save()
            return super().form_valid(form)
        else:
            return self.form_invalid(form)

    def get_success_url(self):
        return self.object.get_absolute_url()


class CommentCreateView(LoginRequiredMixin, CreateView):
    model = Comment
    form_class = CommentCreateForm

    def is_ajax(self):
        return self.request.headers.get('X-Requested-With') == 'XMLHttpRequest'

    def form_invalid(self, form):
        if self.is_ajax():
            return JsonResponse({'errors': form.errors}, status=400)
        return super().form_invalid(form)

    def form_valid(self, form):
        comment = form.save(commit=False)
        comment.post_id = self.kwargs.get('pk')
        comment.author = self.request.user
        comment.parent_id = form.cleaned_data.get('parent')
        comment.save()

        if self.is_ajax():
            return JsonResponse({
                'is_child': comment.is_child_node(),
                'id': comment.id,
                'author': comment.author.username,
                'parent_id': comment.parent_id,
                'time_created': comment.time_created.strftime('%Y-%b-%d %H:%M:%S'),
                'avatar': comment.author.profile.avatar.url,
                'content': comment.content,
                'get_absolute_url': comment.author.profile.get_absolute_url()
            }, status=200)
        return redirect(comment.post.get_absolute_url())

    def handle_no_permission(self):
        return JsonResponse({'error': 'You need to log in to add comments.'}, status=400)


class RatingCreateView(LoginRequiredMixin, View):
    model = Rating

    def post(self, request, *args, **kwargs):
        content_type_id = request.POST.get('content_type_id')
        object_id = request.POST.get('object_id')
        user = request.user
        allowed_value = [1, -1]

        value = int(request.POST.get('value'))
        if value not in allowed_value:
            return JsonResponse({'status': 'error', 'message': 'Invalid rating value'})

        x_forwaded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        ip_address = x_forwaded_for.split(
            ',')[0] if x_forwaded_for else request.META.get('REMOTE_ADDR')

        try:
            content_type = ContentType.objects.get(id=content_type_id)
        except ContentType.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Invalid content type'})

        with transaction.atomic():
            rating, created = self.model.objects.get_or_create(
                content_type=content_type,
                object_id=object_id,
                user=user,
                defaults={'value': value, 'ip_address': ip_address}
            )

        if not created:
            if rating.value == value:
                rating.delete()
                target_object = rating.content_object
                return JsonResponse({
                    'user_vote': 0,
                    'rating_sum': target_object.get_sum_rating() if target_object else 0})
            else:
                rating.value = value
                rating.ip_address = ip_address
                rating.save()
                return JsonResponse({
                    'user_vote': value,
                    'rating_sum': rating.content_object.get_sum_rating()})
        else:
            return JsonResponse({
                'user_vote': value,
                'rating_sum': rating.content_object.get_sum_rating()})


class RatingStatusView(LoginRequiredMixin, View):
    def get(self, request, *args, **kwargs):
        content_type_id = request.GET.get('content_type')
        object_id = request.GET.get('object_id')

        if not content_type_id or not object_id:
            return JsonResponse({'error': 'Missing content_type or object_id'}, status=400)

        try:
            content_type = ContentType.objects.get(id=content_type_id)
            rating = Rating.objects.filter(
                user=request.user,
                content_type=content_type,
                object_id=object_id
            ).first()

            user_vote = rating.value if rating else 0
            target_object = content_type.get_object_for_this_type(id=object_id)
            rating_sum = target_object.get_sum_rating() if target_object else 0

            return JsonResponse({
                'user_vote': user_vote,
                'rating_sum': rating_sum
            })
        except ContentType.DoesNotExist:
            return JsonResponse({'error': 'Invalid content_type'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
