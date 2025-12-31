let user = getUser();
if (!user) location.href = "login.html";

function toggleMenu() {
  document.getElementById("sideMenu").classList.toggle("open");
}

function openCategory(type) {
  let formats = {
    incident: `Incident Type:
Location:
Description:
Officer Name:`,
    report: `Report Title:
Details:
Officer Name:`,
    warrant: `Suspect Name:
Crime:
Issued By:`
  };

  document.getElementById("postArea").innerHTML = `
    <h3>${type.toUpperCase()}</h3>
    <textarea id="content">${formats[type]}</textarea>
    <button onclick="submitPost('${type}')">Submit</button>
  `;
}

function submitPost(type) {
  let content = document.getElementById("content").value;

  let post = {
    type,
    content,
    officer: user.name,
    role: user.role,
    time: new Date().toLocaleString()
  };

  let posts = JSON.parse(localStorage.getItem("posts") || "[]");
  posts.push(post);
  localStorage.setItem("posts", JSON.stringify(posts));

  alert("Posted Successfully");
}
