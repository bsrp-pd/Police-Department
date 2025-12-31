// Firebase Config (Replace with your real keys!)
const firebaseConfig = {
  apiKey: "AIzaSyBq0GahN12jj-oESFeSKm_gofNK_CSaPZU",
  authDomain: "bspd-2f53d.firebaseapp.com",
  projectId: "bspd-2f53d",
  storageBucket: "bspd-2f53d.firebasestorage.app",
  messagingSenderId: "733364732184",
  appId: "1:733364732184:web:fe393cfcb20ac3e6395e6d"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Global Variables
let currentUser = null;
const highCommandPassword = "admin123"; // Change in production

// Utility Functions
function toggleMenu() {
    document.getElementById('sideMenu').classList.toggle('open');
    document.getElementById('mobileMenu').classList.toggle('show');
}

function showSection(section) {
    document.querySelectorAll('.content > div').forEach(el => el.classList.add('hidden'));
    document.getElementById(section + 'Form' || section + 'List').classList.remove('hidden');
}

function updateUserHeader() {
    if (currentUser) {
        document.getElementById('userHeader').innerHTML = `${currentUser.ign} | ${currentUser.rank} | Active`;
    } else {
        document.getElementById('userHeader').innerHTML = 'Not Logged In';
    }
}

// Registration
function registerUser() {
    const ign = document.getElementById('ign').value;
    if (ign) {
        currentUser = { ign, rank: 'Officer', activity: 'Active' };
        db.ref('users/' + ign).set(currentUser).then(() => {
            updateUserHeader();
            alert('Registration successful! You can now post.');
            localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Persist login
        }).catch(error => {
            console.error('Registration error:', error);
            alert('Registration failed. Check console for details.');
        });
    } else {
        alert('Please enter an In-Game Name.');
    }
}

// High Command
function showHighCommand() {
    const password = prompt('Enter High Command Password:');
    if (password === highCommandPassword) {
        alert('High Command Access Granted.');
        // Add admin UI here
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

// Academy Editing
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
    if (data && document.getElementById('handbookDesc')) {
        document.getElementById('handbookDesc').innerText = data.handbook || 'Default description';
        document.getElementById('documentsDesc').innerText = data.documents || 'Default description';
    }
});

// Copy Template
function copyTemplate(categoryKey) {
    const templates = {
        incident: "[Incident Details]\nLocation:\nDescription:\nSuspects:",
        report: "[Report Details]\nType:\nDetails:",
        warrant: "[Warrant Details]\nSuspect:\nReason:"
    };
    navigator.clipboard.writeText(templates[categoryKey]).then(() => {
        alert('Template copied!');
    }).catch(err => {
        console.error('Copy failed:', err);
        alert('Copy failed. Check permissions.');
    });
}

// Submit Post with Debugging
function submitPost(categoryKey) {
    const content = document.getElementById('postContent').value.trim();
    if (!content) {
        alert('Please fill in the post content.');
        return;
    }
    if (!currentUser) {
        alert('Please register/login first.');
        return;
    }
    console.log('Submitting post:', { categoryKey, content, user: currentUser }); // Debug log
    const post = {
        author: currentUser.ign,
        rank: currentUser.rank,
        timestamp: new Date().toISOString(),
        content,
        category: categoryKey
    };
    db.ref('posts/' + categoryKey).push(post).then(() => {
        alert('Post submitted successfully!');
        document.getElementById('postContent').value = '';
        console.log('Post saved to Firebase.'); // Debug log
    }).catch(error => {
        console.error('Post submission error:', error);
        alert('Post failed. Check console for details.');
    });
}

// Load Posts with Serial Numbers and Edit Menu
function loadPosts(categoryKey) {
    db.ref('posts/' + categoryKey).on('value', snapshot => {
        const posts = snapshot.val();
        let html = '';
        let serial = 1;
        if (posts) {
            for (let id in posts) {
                const p = posts[id];
                html += `
                    <div class="post-item">
                        <div class="post-header">${serial}. [${p.author}] | [${p.rank}] | [${new Date(p.timestamp).toLocaleString()}]</div>
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
        } else {
            html = '<p>No posts yet.</p>';
        }
        if (document.getElementById('postsList')) {
            document.getElementById('postsList').innerHTML = html;
        }
    }, error => {
        console.error('Load posts error:', error);
        alert('Failed to load posts. Check console.');
    });
}

// Toggle Edit Menu (RBAC)
function toggleEdit(postId, categoryKey) {
    const editDiv = document.getElementById(`edit-${postId}`);
    if (!currentUser) {
        alert('Please login.');
        return;
    }
    db.ref('posts/' + categoryKey + '/' + postId).once('value').then(snapshot => {
        const post = snapshot.val();
        if (['IGP', 'AIGP', 'DIG'].includes(currentUser.rank) || post.author === currentUser.ign) {
            editDiv.classList.toggle('show');
        } else {
            alert('Access Denied');
        }
    });
}

// Save Edit
function saveEdit(postId, categoryKey) {
    const newContent = document.getElementById(`edit-content-${postId}`).value;
    db.ref('posts/' + categoryKey + '/' + postId).update({ content: newContent }).then(() => {
        alert('Edit saved!');
    }).catch(error => {
        console.error('Edit error:', error);
        alert('Edit failed.');
    });
}

// Delete Post
function deletePost(postId, categoryKey) {
    if (currentUser && ['IGP', 'AIGP', 'DIG'].includes(currentUser.rank)) {
        db.ref('posts/' + categoryKey + '/' + postId).remove().then(() => {
            alert('Post deleted!');
        }).catch(error => {
            console.error('Delete error:', error);
            alert('Delete failed.');
        });
    } else {
        alert('Access Denied');
    }
}

// My Posts
function showMyPosts() {
    if (!currentUser) {
        alert('Please login.');
        return;
    }
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
        document.getElementById('userPosts').innerHTML = myPosts || '<p>No posts found.</p>';
    });
    showSection('myPosts');
}

// Initialize
window.onload = () => {
    // Load saved user
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserHeader();
    }
    // Load posts on sub-pages
    if (window.location.pathname.includes('incident-report.html')) loadPosts('incident');
    if (window.location.pathname.includes('report.html')) loadPosts('report');
    if (window.location.pathname.includes('warrant-issues.html')) loadPosts('warrant');
} 
// ... (Keep existing Firebase config and other functions)

// Hash Password (Simple SHA-256 for client-side)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Register User
async function handleRegister(event) {
    event.preventDefault();
    const ign = document.getElementById('ign').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;
    const terms = document.getElementById('terms').checked;

    if (!ign || !password || !role || !terms) {
        alert('Please fill all fields and accept terms.');
        return;
    }
    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    const hashedPassword = await hashPassword(password);
    const userData = { ign, password: hashedPassword, role, activity: 'Active' };

    db.ref('users/' + ign).set(userData).then(() => {
        alert('Account created successfully! Please login.');
        window.location.href = 'login.html';
    }).catch(error => {
        console.error('Registration error:', error);
        alert('Registration failed. IGN may already exist.');
    });
}

// Login User
async function handleLogin(event) {
    event.preventDefault();
    const ign = document.getElementById('loginIgn').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!ign || !password) {
        alert('Please fill all fields.');
        return;
    }

    const hashedPassword = await hashPassword(password);
    db.ref('users/' + ign).once('value').then(snapshot => {
        const user = snapshot.val();
        if (user && user.password === hashedPassword) {
            currentUser = { ign: user.ign, rank: user.role, activity: user.activity };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUserHeader();
            updateMenu();
            alert('Login successful!');
            window.location.href = 'index.html';
        } else {
            alert('Invalid credentials.');
        }
    }).catch(error => {
        console.error('Login error:', error);
        alert('Login failed.');
    });
}

// Update Menu After Login
function updateMenu() {
    if (currentUser) {
        document.getElementById('createAccountBtn').classList.add('hidden');
        document.getElementById('loginAccountBtn').classList.add('hidden');
        document.getElementById('logoutBtn').classList.remove('hidden');
        // Optionally, add user's IGN to menu
        const menu = document.getElementById('sideMenu');
        menu.insertAdjacentHTML('afterbegin', `<div class="menu-user">${currentUser.ign}</div>`);
    }
}

// Logout
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserHeader();
    updateMenu();
    window.location.href = 'index.html';
}

// Initialize Forms
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
}
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

// Update window.onload to include menu update
window.onload = () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserHeader();
        updateMenu();
    }
    // ... (Keep existing loadPosts logic)
};
