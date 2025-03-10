from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm

from .models import Profile


class UserUpdateForm(forms.ModelForm):

    username = forms.CharField(max_length=30, widget=forms.TextInput(
        attrs={"class": "form-control mb-1"}))
    email = forms.EmailField(widget=forms.TextInput(
        attrs={"class": "form-control mb-1"}))
    first_name = forms.CharField(max_length=30, widget=forms.TextInput(
        attrs={"class": "form-control mb-1"}))
    last_name = forms.CharField(max_length=30, widget=forms.TextInput(
        attrs={"class": "form-control mb-1"}))

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields:
            self.fields[field].widget.attrs.update({
                'class': 'form-control bg-dark text-white',
                'autocomplete': 'off'
            })

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email:
            queryset = User.objects.filter(email=email)
            if self.instance.pk:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise forms.ValidationError('Email already exists.')
        return email


class ProfileUpdateForm(forms.ModelForm):

    class Meta:
        model = Profile
        fields = ('description', 'birth_date', 'gender', 'avatar')
        widgets = {
            'description': forms.Textarea(attrs={'rows': 5, 'class': 'form-control mb-1'}),
            'birth_date': forms.DateInput(attrs={'type': 'date'}),
            'avatar': forms.FileInput(attrs={"class": "form-control mb-1"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields:
            self.fields[field].widget.attrs.update({
                'class': 'form-control bg-dark text-white',
                'autocomplete': 'off'
            })


class UserRegisterForm(UserCreationForm):

    class Meta(UserCreationForm.Meta):
        fields = UserCreationForm.Meta.fields + \
            ('email', 'first_name', 'last_name')

    def clean_email(self):
        email = self.cleaned_data.get('email')
        username = self.cleaned_data.get('username')
        if email and User.objects.filter(email=email).exclude(username=username).exists():
            raise forms.ValidationError(
                'This email address is already used in the system.')
        return email

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        placeholders = {
            'username': 'Create your username',
            'email': 'Enter your e-mail',
            'first_name': 'Enter your name',
            'last_name': 'Enter your surname',
            'password1': 'Create your password',
            'password2': 'Repeat the password you created',
        }

        for field, placeholder in placeholders.items():
            self.fields[field].widget.attrs['placeholder'] = placeholder

        for field in self.fields:
            self.fields[field].widget.attrs.update(
                {'class': 'form-control', 'autocomplete': 'off'})


class UserLoginForm(AuthenticationForm):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'].widget.attrs['placeholder'] = 'Username'
        self.fields['password'].widget.attrs['placeholder'] = 'Password'
        self.fields['username'].label = 'Login'

        for field in self.fields:
            self.fields[field].widget.attrs.update(
                {'class': 'form-control', 'autocomplete': 'off'})
