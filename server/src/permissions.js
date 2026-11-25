const isAdmin = (user) => user?.role === 'admin';

const isOrganizer = (user, event) => String(event.organizer) === String(user._id);

const canManageEvent = (user, event) => isAdmin(user) || isOrganizer(user, event);

module.exports = { isAdmin, canManageEvent };