from rest_framework.permissions import BasePermission

from apps.memberships.models import Membership

PERMISSONS_MAP = {
    Membership.Role.CREATOR.value: [
        'view_community',
        'edit_community',
        'delete_community',
        'add_post',
        'delete_post',
        'delete_another_user_post',
        'invite_member',
        'remove_member',
        'add_moderator',
        'delete_moderator'
    ],
    Membership.Role.MODERATOR.value: [
        'view_community',
        'invite_member',
        'remove_member',
        'add_post',
        'delete_post',
        'delete_another_user_post',
    ],
    Membership.Role.MEMBER.value: [
        'view_community',
        'add_post',
        'delete_post',
    ],
}


class IsCommunityCreator(BasePermission):

    def has_object_permission(self, request, view, obj):
        for m in getattr(obj, 'current_user_memberships', []):
            if m.role == Membership.Role.CREATOR:
                return True
        return False


class HasCommunityPermission(BasePermission):

    def has_object_permission(self, request, view, obj):
        permission = getattr(view, 'requiered_permission', None)
        if not permission or not request.user.is_authenticated:
            return False
        roles = obj.members.filter(
            user=request.user).values_list('role', flat=True)
        user_permissions = {
            permission
            for role in roles
            for permission in PERMISSONS_MAP.get(role, [])
        }
        print(user_permissions)
        return permission in user_permissions


class CannotLeaveIfCreator(BasePermission):

    def has_object_permission(self, request, view, obj):
        if obj.role == Membership.Role.CREATOR:
            return False
        return True
