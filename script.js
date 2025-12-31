// Firebase Config (Replace with your own from Firebase Console)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Global Variables
let currentUser = null;
const highCommandPassword = "admin123"; // Change in production

// Utility Functions
function toggleMenu() {
    document.getElementById('sideMenu').classList.toggle('open');
}

function showSection(section) {
    document.querySelectorAll('.content > div').forEach(el => el.classList.add('hidden'));
    document.getElementById(section + 'Form' || section + 'List').classList.remove('hidden');
}

function updateUserHeader() {
    if (currentUser) {
        document.getElementById('userHeader').innerHTML = `${currentUser.ign} | ${currentUser.rank} | Active`;
    }
}

// Registration
function registerUser() {
    const ign = document.getElementById('ign').value;
    if (ign) {
        currentUser = { ign, rank: 'Officer', activity: 'Active' };
        db.ref('users/' + ign).set(currentUser);
        updateUserHeader();
        alert('Registered!');
    }
}

// High Command (Password Protected)
function showHighCommand() {
    const password = prompt('Enter High Command Password:');
    if (password === highCommandPassword) {
        // Simulate admin panel (expand in production)
        alert('High Command Access Granted. Full admin rights here.');
        // Add role management UI here
    } else {
        alert('Access Denied');
    }
}

// Personnel List
function showPersonnel() {
    db.ref('users').on('value', snapshot => {
        const personnel = snapshot.val();
        let list = '';
        for (let user in personnel) {
            list += `<p>${personnel[user].ign} - ${personnel[user].rank}</p>`;
        }
        document.getElementById('personnel').innerHTML = list;
    });
    showSection('personnel');
}

// Academy Editing (High Command Only)
function editDescription(type) {
    if (currentUser && ['IGP', 'AIGP', 'DIG'].includes(currentUser.rank)) {
        const newDesc = prompt('Edit description:');
        db.ref('academy/' + type).set(newDesc);
    } else {
        alert('Access Denied');
    }
}

// Load Academy Descriptions
db.ref('academy').on('value', snapshot => {
    const data = snapshot.val();
    if (data) {
        document.getElementById('handbookDesc').innerText = data.handbook || 'Default description';
        document.getElementById('documentsDesc').innerText = data.documents || 'Default description';
    }
});

// Headquarters Templates and Posts
const templates = {
    incident: "[Incident Details]\nLocation:\nDescription:\nSuspects:",
    report: "[Report Details]\nType:\nDetails:",
    warrant: "[Warrant Details]\nSuspect:\nReason:"
};

function copyTemplate(type) {
    navigator.clipboard.writeText(templates[type]);
    alert('Template copied!');
}

function submitPost(type) {
    const content = document.getElementById(type + 'Post').value;
    if (content && currentUser) {
        const post = {
            author: currentUser.ign,
            rank: currentUser.rank,
            timestamp: new Date().toISOString(),
            content
        };
        db.ref('posts/' + type).push(post);
        document.getElementById(type + 'Post').value = '';
    }
}

// Load Posts
['incident', 'report', 'warrant'].forEach(type => {
    db.ref('posts/' + type).on('value', snapshot => {
        const posts = snapshot.val();
        let html = '';
        for (let id in posts) {
            const p = posts[id];
            html += `<p>[${p.author}] | [${p.rank}] | [${p.timestamp}]<br>${p.content}</p>`;
        }
        document.getElementById(type + 'Posts').innerHTML = html;
    });
});

// My Posts
function showMyPosts() {
    if (currentUser) {
        // Aggregate posts by user (simplified)
        db.ref('posts').on('value', snapshot => {
            const allPosts = snapshot.val();
            let myPosts = '';
            for (let channel in allPosts) {
                for (let id in allPosts[channel]) {
                    if (allPosts[channel][id].author === currentUser.ign) {
                        myPosts += `<p>${channel}: ${allPosts[channel][id].content}</p>`;
                    }
                }
            }
            document.getElementById('userPosts').innerHTML = myPosts;
        });
    }
    showSection('myPosts');
}

// Initialize
window.onload = () => {
    // Load current user from localStorage (or Firebase Auth in production)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserHeader();
    }
};
// Copy Template Function
function copyTemplate(categoryKey) {
    const templates = {
        incident: "[Incident Details]\nLocation:\nDescription:\nSuspects:",
        report: "[Report Details]\nType:\nDetails:",
        warrant: "[Warrant Details]\nSuspect:\nReason:"
    };
    navigator.clipboard.writeText(templates[categoryKey]);
    alert('Template copied!');
}

// Submit Post Function
function submitPost(categoryKey) {
    const content = document.getElementById('postContent').value;
    if (content && currentUser) {
        const post = {
            author: currentUser.ign,
            rank: currentUser.rank,
            timestamp: new Date().toISOString(),
            content,
            category: categoryKey
        };
        db.ref('posts/' + categoryKey).push(post);
        document.getElementById('postContent').value = '';
    } else {
        alert('Please log in and fill in details.');
    }
}

// Load Posts with 3-Dot Menu
function loadPosts(categoryKey) {
    db.ref('posts/' + categoryKey).on('value', snapshot => {
        const posts = snapshot.val();
        let html = '';
        let serial = 1;
        for (let id in posts) {
            const p = posts[id];
            html += `
                <div class="post-item">
                    <div class="post-header">${serial}. [${p.author}] | [${p.rank}] | [${p.timestamp}]</div>
                    <div class="post-content">${p.content}</div>
                    <div class="post-menu" onclick="toggleEdit('${id}', '${categoryKey}')">⋮</div>
                    <div id="edit-${id}" class="edit-option">
                        <textarea id="edit-content-${id}">${p.content}</textarea>
                        <button onclick="saveEdit('${id}', '${categoryKey}')">Save</button>
                        <button onclick="deletePost('${id}', '${categoryKey}')">Delete</button>
                    </div>
                </div>
            `;
            serial++;
        }
        document.getElementById('postsList').innerHTML = html;
    });
}

// Toggle Edit Menu (RBAC: Only High Command or Author)
function toggleEdit(postId, categoryKey) {
    const editDiv = document.getElementById(`edit-${postId}`);
    if (currentUser && (['IGP', 'AIGP', 'DIG'].includes(currentUser.rank) || db.ref('posts/' + categoryKey + '/' + postId).once('value').then(snap => snap.val().author === currentUser.ign))) {
        editDiv.classList.toggle('show');
    } else {
        alert('Access Denied');
    }
}

// Save Edit
function saveEdit(postId, categoryKey) {
    const newContent = document.getElementById(`edit-content-${postId}`).value;
    db.ref('posts/' + categoryKey + '/' + postId).update({ content: newContent });
}

// Delete Post (High Command Only)
function deletePost(postId, categoryKey) {
    if (currentUser && ['IGP', 'AIGP', 'DIG'].includes(currentUser.rank)) {
        db.ref('posts/' + categoryKey + '/' + postId).remove();
    } else {
        alert('Access Denied');
    }
}

// Initialize Posts on Sub-Pages
if (window.location.pathname.includes('incident-report.html')) loadPosts('incident');
if (window.location.pathname.includes('report.html')) loadPosts('report');
if (window.location.pathname.includes('warrant-issues.html')) loadPosts('warrant');
                                                          
