import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA5HIbPvUH0TOK77orGcVrpbno7tdFA1Fg",
    authDomain: "datingproject-f3720.firebaseapp.com",
    projectId: "datingproject-f3720",
    storageBucket: "datingproject-f3720.firebasestorage.app",
    messagingSenderId: "5302696540",
    appId: "1:5302696540:web:42959e5db2ffc03a090499"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let filtroAtual = "todos";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        setupFiltros();
        renderHeader(user);
        renderUsers(); 
    }
});

function setupFiltros() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.onclick = () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroAtual = btn.getAttribute('data-filter');
            renderUsers();
        };
    });
}

async function renderHeader(user) {
    const docSnap = await getDoc(doc(db, "usuarios", user.uid));
    const nome = docSnap.exists() ? docSnap.data().nome : "Utilizador";
    
    document.getElementById("auth-buttons").innerHTML = `
        <span style="font-weight:600; color: #333;">Olá, ${nome}!</span>
        <button id="logoutBtn" class="login" style="margin-left:15px; background: #ff4b2b; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer;">Sair</button>
    `;

    document.getElementById("logoutBtn").onclick = () => {
        signOut(auth).then(() => window.location.href = "index.html");
    };
}

async function renderUsers() {
    const grid = document.getElementById("users-grid");
    grid.innerHTML = `<div class="loading-animation"><span class="spinner"></span> A procurar conexões...</div>`;

    try {
        const querySnapshot = await getDocs(collection(db, "usuarios"));
        grid.innerHTML = ""; 
        let encontrouAlguem = false;

        querySnapshot.forEach((userDoc) => {
            const data = userDoc.data();

            if (data.uid === auth.currentUser.uid) return;

            if (filtroAtual !== "todos") {
                const generoAlvo = (filtroAtual === "homens") ? "homem" : "mulher";
                if (data.genero?.toLowerCase() !== generoAlvo) return;
            }

            encontrouAlguem = true;
            const age = calcularIdade(data.nascimento);
            
            // LOGICA DA FOTO: Se data.foto existir, usa ela. Se não, usa o placeholder.
            const fotoPerfil = data.foto || `https://via.placeholder.com/400x500?text=${data.nome}`;
            
            grid.innerHTML += `
                <div class="user-card">
                    <div class="user-photo-container">
                        <img src="${fotoPerfil}" class="user-photo" alt="Foto de ${data.nome}">
                        <div class="photo-overlay"></div>
                    </div>
                    <div class="user-info">
                        <h3>${data.nome} <span>${age}</span></h3>
                        <p>${data.bio || "Olá! Vamos conversar?"}</p>
                    </div>
                    <div class="card-actions">
                        <button class="action-btn pass" title="Passar"><i class="fa-solid fa-xmark"></i></button>
                        <button class="action-btn like" title="Curtir"><i class="fa-solid fa-heart"></i></button>
                    </div>
                </div>
            `;
        });

        if (!encontrouAlguem) {
            grid.innerHTML = `
                <div class="empty-feed">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    <h2>Ninguém por aqui...</h2>
                    <p>Tenta mudar os teus filtros!</p>
                </div>
            `;
        }

    } catch (error) {
        console.error("Erro:", error);
        grid.innerHTML = "<p>Erro ao carregar o feed.</p>";
    }
}

function calcularIdade(dataNasc) {
    if(!dataNasc) return "??";
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
}
