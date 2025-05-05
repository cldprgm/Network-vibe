from django import forms
from django.forms import inlineformset_factory
from django.core.files import File
from django_select2.forms import ModelSelect2Widget
from PIL import Image
from io import BytesIO
import os

from .models import Post, Media, Comment, Community


class PostCreateForm(forms.ModelForm):
    title = forms.CharField(min_length=5)

    class Meta:
        model = Post
        fields = ('title', 'description', 'status', 'community')
        widgets = {
            'description': forms.Textarea(attrs={'rows': 5, 'placeholder': 'Body'}),
            'community': ModelSelect2Widget(
                model=Community,
                search_fields=['name__icontains'],
                attrs={
                    'data-placeholder': 'Select a community',
                    'class': 'form-control text-white rounded-4'
                }
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['title'].widget.attrs['placeholder'] = 'Title'

        for field in self.fields:
            if field != 'community':
                self.fields[field].widget.attrs.update({
                    'class': 'form-control bg-dark text-white rounded-4',
                    'autocomplete': 'off',
                })


class MediaForm(forms.ModelForm):
    class Meta:
        model = Media
        fields = ('file', 'media_type')


MediaFormSet = inlineformset_factory(
    Post,
    Media,
    form=MediaForm,
    extra=1,
    can_delete=False
)


class CommentCreateForm(forms.ModelForm):

    parent = forms.IntegerField(widget=forms.HiddenInput, required=False)
    content = forms.CharField(label='', widget=forms.Textarea(
        attrs={'cols': 10,
               'rows': 3,
               'placeholder': 'Join the conversation',
               'class': 'form-control rounded-4 border-1 bg-dark text-white',
               }))

    class Meta:
        model = Comment
        fields = ('content', )


class CommunityCreateForm(forms.ModelForm):
    name = forms.CharField(min_length=4, max_length=21)

    banner_x = forms.IntegerField(
        widget=forms.widgets.HiddenInput(), required=False)
    banner_y = forms.IntegerField(
        widget=forms.widgets.HiddenInput(), required=False)
    banner_width = forms.IntegerField(
        widget=forms.widgets.HiddenInput(), required=False)
    banner_height = forms.IntegerField(
        widget=forms.widgets.HiddenInput(), required=False)

    class Meta:
        model = Community
        fields = ['name', 'description', 'banner',
                  'icon', 'categories', 'is_nsfw', 'visibility']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 5, 'placeholder': 'Description'}),
        }

    def clean_categories(self):
        categories = self.cleaned_data.get('categories')
        if categories and categories.count() > 3:
            raise forms.ValidationError(
                'You cannot select more than 3 categories.')
        return categories

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['name'].widget.attrs['placeholder'] = 'Community name'

        for field in self.fields:
            self.fields[field].widget.attrs.update({
                'class': 'form-control bg-dark text-white rounded-4',
                'autocomplete': 'off',
            })

    def clean(self):
        cleaned_data = super().clean()
        if cleaned_data.get('banner'):
            if not all(cleaned_data.get(f'banner_{k}') is not None for k in ['x', 'y', 'width', 'height']):
                raise forms.ValidationError('Please select a crop area.')
        return cleaned_data

    def save(self, commit=True):
        instance = super().save(commit=False)

        banner_file = self.cleaned_data.get('banner')

        if banner_file and all(self.cleaned_data.get(f'banner_{k}') is not None for k in ['x', 'y', 'width', 'height']):
            x = self.cleaned_data['banner_x']
            y = self.cleaned_data['banner_y']
            width = self.cleaned_data['banner_width']
            height = self.cleaned_data['banner_height']

            try:
                image = Image.open(banner_file)
                cropped_image = image.crop((x, y, x + width, y + height))

                buffer = BytesIO()
                image_format = image.format or 'JPEG'
                cropped_image.save(buffer, format=image_format)
                buffer.seek(0)

                original_filename = banner_file.name
                _, ext = os.path.splitext(original_filename)
                ext = ext or '.jpg'
                new_filename = f"{instance.name.replace(' ', '_')}_banner{ext}"

                instance.banner.save(new_filename, File(buffer), save=False)

            except Exception as e:
                raise forms.ValidationError(
                    f"Image processing error: {str(e)}")

        elif banner_file:
            instance.banner = banner_file

        if commit:
            instance.save()

        return instance
