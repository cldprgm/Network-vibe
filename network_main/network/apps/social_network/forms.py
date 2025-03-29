from django import forms
from django.forms import inlineformset_factory

from .models import Post, Media, Comment, Community


class PostCreateForm(forms.ModelForm):
    title = forms.CharField(min_length=5)

    class Meta:
        model = Post
        fields = ('title', 'description', 'status')
        widgets = {
            'description': forms.Textarea(attrs={'rows': 5, 'placeholder': 'Body'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['title'].widget.attrs['placeholder'] = 'Title'

        for field in self.fields:
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
