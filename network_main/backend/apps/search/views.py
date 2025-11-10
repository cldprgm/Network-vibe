from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from django.db.models import F, Value, CharField

from apps.communities.models import Community
from apps.users.models import CustomUser

from .serializers import SearchSerializer
from .throttles import SearchThrottle


TOP_RESULT_LIMIT = 10


class SearchView(APIView):
    throttle_classes = [SearchThrottle]

    def get(self, request, *args, **kwargs):
        query_param = request.query_params.get('q', '')
        if not query_param:
            return Response(
                {'error': 'parameter cannot be empty'},
                status=status.HTTP_400_BAD_REQUEST
            )

        search_query = SearchQuery(query_param, config='english')

        community_vector = SearchVector('name', config='english')
        communities = Community.objects.annotate(
            search=community_vector
        ).filter(
            search=search_query
        ).annotate(
            rank=SearchRank(F('search'), search_query),
            type=Value('community', output_field=CharField())
        ).annotate(
            title=F('name')
        ).values(
            'id', 'title', 'rank', 'type'
        )

        user_vector = SearchVector('username', config='english')
        users = CustomUser.objects.annotate(
            search=user_vector
        ).filter(
            search=search_query
        ).annotate(
            rank=SearchRank(F('search'), search_query),
            type=Value('user', output_field=CharField())
        ).annotate(
            title=F('username')
        ).values(
            'id', 'title', 'rank', 'type'
        )

        combined_results = list(communities.union(
            users).order_by('-rank')[:TOP_RESULT_LIMIT])

        community_ids = [item['id']
                         for item in combined_results if item['type'] == 'community']
        user_ids = [item['id']
                    for item in combined_results if item['type'] == 'user']

        found_communities = Community.objects.filter(pk__in=community_ids)
        found_users = CustomUser.objects.filter(pk__in=user_ids)

        communities_map = {c.id: c for c in found_communities}
        users_map = {u.id: u for u in found_users}

        serializer_context = {
            'communities_map': communities_map,
            'users_map': users_map
        }

        serializer = SearchSerializer(
            combined_results,
            many=True,
            context=serializer_context
        )

        return Response(serializer.data)
