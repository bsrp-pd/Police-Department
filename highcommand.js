let user = getUser();
if (!user) location.href = "login.html";

if (!["IGP","AIGP","DIG"].includes(user.role)) {
  alert("Access Denied");
  location.href = "dashboard.html";
}

let list = document.getElementById("policeList");

for (let key in localStorage) {
  if (key.startsWith("police_")) {
    let u = JSON.parse(localStorage.getItem(key));

    list.innerHTML += `
      <div class="card">
        ${u.name} | ${u.role}
        <select onchange="changeRole('${u.name}', this.value)">
          <option>RECRUIT</option>
          <option>Constable</option>
          <option>ASI</option>
          <option>SI</option>
          <option>Inspector</option>
          <option>ASP</option>
          <option>SP</option>
          <option>DIG</option>
          <option>AIGP</option>
          <option>IGP</option>
        </select>
      </div>
    `;
  }
}

function changeRole(name, role) {
  let u = JSON.parse(localStorage.getItem("police_" + name));
  u.role = role;
  localStorage.setItem("police_" + name, JSON.stringify(u));
  alert("Role Updated");
  location.reload();
}
