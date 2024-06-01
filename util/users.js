let users = [];
// Join user to chat
function userJoin(eventId, username, eventname) {
  const user = { eventId, username, eventname };

  users.push(user);

  return user;
}

// Get current user
function getCurrentUser(username) {
  return users.find(user => user.username === username);
}

// User leaves chat
function userLeave(username) {
  let updatedUsers = []
  const index = users.findIndex(user => user.username === username);

  console.log('userLeave: Index', index)
  for (let i = 0; i < users.length; i++){
    if (i !== index){
      updatedUsers.push(users[i])
    }
    else{
      continue
    }
  } 
  users = updatedUsers
  console.log('updated users: ', updatedUsers)
  return;
}

// Get getliveUsers
function getliveUsers(eventId) {
  return users.filter(user => user.eventId === eventId);
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getliveUsers
};
