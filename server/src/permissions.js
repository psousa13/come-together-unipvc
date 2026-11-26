const isAdmin = (user) => user?.role === 'admin';

const isOrganizer = (user, event) => String(event.organizer) === String(user._id);

const canManageEvent = (user, event) => isAdmin(user) || isOrganizer(user, event);

const isCommunityAdmin = (user, community) =>
  community.admins.some((a) => String(a) === String(user._id));

const canManageCommunity = (user, community) => isAdmin(user) || isCommunityAdmin(user, community);

module.exports = { isAdmin, canManageEvent, isCommunityAdmin, canManageCommunity };