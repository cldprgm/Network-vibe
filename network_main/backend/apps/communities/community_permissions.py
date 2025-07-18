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
