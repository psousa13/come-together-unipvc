const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  username: u.username,
  displayName: u.displayName,
  avatar: u.avatar,
  school: u.school,
  memberType: u.memberType,
  course: u.course,
  bio: u.bio || '',
  role: u.role,
});

module.exports = { publicUser };