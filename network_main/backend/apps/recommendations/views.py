from rest_framework import views
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from django.db.models import Count

from apps.communities.models import Community
from apps.communities.serializers import CommunityListSerializer


class CommunityRecommendationView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        subscribed_communities = Community.objects.filter(members__user=user)

        if not subscribed_communities.exists():
            popular_communities = Community.objects.annotate(
                members_count=Count('members')
            )[:10].select_related('creator')

            serializer = CommunityListSerializer(
                popular_communities, many=True
            )
            return Response(
                {'type': 'just_popular_communities',
                 'recommendations': serializer.data},
                status=status.HTTP_200_OK
            )

        interested_categories_ids = subscribed_communities.values_list(
            'categories', flat=True).distinct()

        recomended_communities = Community.objects.filter(
            categories__id__in=interested_categories_ids
        ).exclude(pk__in=subscribed_communities)

        recomended_communities = recomended_communities.order_by(
            '?')[:6].select_related('creator')

        serializer = CommunityListSerializer(recomended_communities, many=True)

        return Response(
            {'type': 'recommended_communities',
             'recommendations': serializer.data},
            status=status.HTTP_200_OK
        )
