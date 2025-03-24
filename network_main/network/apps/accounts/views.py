from django.shortcuts import render
from django.views.generic import DetailView, UpdateView, CreateView
from django.contrib.messages.views import SuccessMessageMixin
from django.contrib.auth.views import LoginView, LogoutView
from django.db import transaction
from django.urls import reverse_lazy
from django.contrib.contenttypes.models import ContentType
from django.db.models import Count


from .models import Profile
from apps.social_network.models import Post
from .forms import ProfileUpdateForm, UserUpdateForm, UserRegisterForm, UserLoginForm


class ProfileDetailView(DetailView):
    model = Profile
    context_object_name = 'profile'
    template_name = 'accounts/profile_detail.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.object.user

        posts = Post.published.filter(author=user).prefetch_related('media').annotate(
            comments_count=Count('comments'))
        post_content_type = ContentType.objects.get_for_model(Post).id

        context["title"] = f'User profile: {user.username}'
        context['posts'] = posts
        context['post_content_type'] = post_content_type
        return context


class ProfileUpdateView(SuccessMessageMixin, UpdateView):
    model = Profile
    form_class = ProfileUpdateForm
    template_name = 'accounts/update_profile.html'
    success_message = 'Profile has been successfully updated.'

    def get_object(self, queryset=None):
        return self.request.user.profile

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = f'Editing user profile: {self.request.user.username}'
        if self.request.POST:
            context['user_form'] = UserUpdateForm(
                self.request.POST, instance=self.request.user)
        else:
            context['user_form'] = UserUpdateForm(instance=self.request.user)
        return context

    def form_valid(self, form):
        context = self.get_context_data()
        user_form = context['user_form']
        with transaction.atomic():
            if all([user_form.is_valid(), form.is_valid()]):
                user_form.save()
                form.save()
            else:
                context.update({'user_form': user_form})
                return self.render_to_response(context)
        return super(ProfileUpdateView, self).form_valid(form)

    def get_success_url(self):
        return reverse_lazy('profile_detail', kwargs={'slug': self.object.slug})


class UserRegisterView(SuccessMessageMixin, CreateView):
    form_class = UserRegisterForm
    success_url = reverse_lazy('home')
    template_name = 'accounts/user_register.html'
    success_message = 'You have successfully registered!'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = 'Registration'
        return context


class UserLoginView(SuccessMessageMixin, LoginView):
    form_class = UserLoginForm
    next_page = 'home'
    template_name = 'accounts/user_login.html'
    success_message = 'Welcome to the Network!'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = 'Login'
        return context


class UserLogoutView(LogoutView):
    next_page = reverse_lazy('home')
