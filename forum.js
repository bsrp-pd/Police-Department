// Temporary user mock (later auth.js থেকে আসবে)
let user = {
  name: "Constable_Salim",
  role: "Constable"
};

document.getElementById("userBar").innerText =
  user.name + " | " + user.role;

function openCategory(type) {
  // Next phase: category thread list
  alert("Opening " + type + " forum");
}
