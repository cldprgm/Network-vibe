from django import forms
from django.forms import inlineformset_factory

from .models import Post, Media, Comment


class PostCreateForm(forms.ModelForm):
    title = forms.CharField(min_length=5)

    class Meta:
        model = Post
        fields = ('title', 'description', 'category', 'status')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields:
            self.fields[field].widget.attrs.update({
                'class': 'form-control bg-dark text-white rounded-4',
                'autocomplete': 'off'
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
