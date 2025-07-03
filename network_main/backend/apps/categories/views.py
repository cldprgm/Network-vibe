from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from django.db.models import Prefetch

from apps.communities.models import Community

from .models import Category
from .serializers import ParentCategorySerializer


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ParentCategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    http_method_names = ['get']
    lookup_field = 'id'

    def get_queryset(self):
        queryset = Category.objects.filter(parent__isnull=True).prefetch_related(
            Prefetch(
                'children',
                queryset=Category.objects.prefetch_related(
                    Prefetch(
                        'communities',
                        queryset=Community.objects.select_related('creator')
                    )
                )
            )
        )
        return queryset
