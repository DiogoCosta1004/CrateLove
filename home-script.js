import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

/* ===== PROTEÇÃO DE ROTA E INICIALIZAÇÃO ===== */
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Se tentar acessar a home sem estar logado, expulsa para o index
        window.location.href = "index.html";
    } else {
        renderHeader(user);
        renderUsers();
    }
});

/* ===== RENDERIZAR CABEÇALHO ===== */
async function renderHeader(user) {
    const docSnap = await getDoc(doc(db, "usuarios", user.uid));
    const nome = docSnap.exists() ? docSnap.data().nome : "Usuário";
    
    const authContainer = document.getElementById("auth-buttons");
    authContainer.innerHTML = `
        <span style="font-weight:600; color: #1a1a1a;">Olá, ${nome}!</span>
        <button id="logoutBtn" class="login" style="margin-left:15px; background: #1c1c1c;">Sair</button>
    `;

    document.getElementById("logoutBtn").onclick = () => {
        signOut(auth).then(() => {
            window.location.href = "index.html";
        });
    };
}

/* ===== BUSCAR E EXIBIR USUÁRIOS ===== */
async function renderUsers() {
    const grid = document.getElementById("users-grid");
    
    try {
        const querySnapshot = await getDocs(collection(db, "usuarios"));
        grid.innerHTML = ""; 

        let found = false;

        querySnapshot.forEach((userDoc) => {
            const data = userDoc.data();
            if (data.uid === auth.currentUser.uid) return;
            found = true;

            const age = calcularIdade(data.nascimento);
            
            grid.innerHTML += `
                <div class="user-card">
                    <div class="user-photo-container">
                        <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500" class="user-photo">
                        <div class="photo-overlay"></div>
                    </div>
                    <div class="user-info">
                        <h3>${data.nome} <span>${age}</span></h3>
                        <p>${data.bio || "Olá! Que tal começarmos uma conversa?"}</p>
                    </div>
                    <div class="card-actions">
                        <button class="action-btn pass" title="Passar"><i class="fa-solid fa-xmark"></i></button>
                        <button class="action-btn like" title="Curtir"><i class="fa-solid fa-heart"></i></button>
                    </div>
                </div>
            `;
        });

        if (!found) {
            grid.innerHTML = `
                <div class="empty-feed">
                    <i class="fa-solid fa-earth-americas"></i>
                    <h2>Você viu todo mundo por enquanto!</h2>
                    <p>Que tal expandir seus filtros ou voltar mais tarde?</p>
                </div>
            `;
        }

    } catch (error) {
        console.error("Erro:", error);
    }
}

/* ===== UTILITÁRIO: CÁLCULO DE IDADE ===== */
function calcularIdade(dataNasc) {
    if (!dataNasc) return "??";
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
        idade--;
    }
    return idade;
}