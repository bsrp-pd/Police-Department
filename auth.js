function register() {
  let name = document.getElementById("name").value;
  let pass = document.getElementById("password").value;

  if (!name || !pass) {
    alert("Fill all fields");
    return;
  }

  let user = {
    name: name,
    password: pass,
    role: "Constable",
    status: "Active"
  };

  localStorage.setItem("police_" + name, JSON.stringify(user));
  alert("Account Created");
  window.location.href = "login.html";
}

function login() {
  let name = document.getElementById("name").value;
  let pass = document.getElementById("password").value;

  let user = JSON.parse(localStorage.getItem("police_" + name));

  if (!user || user.password !== pass) {
    alert("Invalid Login");
    return;
  }

  localStorage.setItem("currentUser", JSON.stringify(user));
  window.location.href = "dashboard.html";
}

function getUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
      }
