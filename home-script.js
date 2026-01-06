import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc, 
    serverTimestamp,
    query,
    where 
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

let filtroAtual = "todos";

/* ==========================================
   MONITOR DE AUTENTICAÇÃO
   ========================================== */
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        setupFiltros();
        renderHeader(user);
        renderUsers(); 
    }
});

/* ==========================================
   LÓGICA DE INTERAÇÃO (MATCH & LIKE)
   ========================================== */

window.curtirUsuario = async function(outroId, outroNome) {
    const meuId = auth.currentUser.uid;

    try {
        // 1. Registra o seu Like no banco
        await setDoc(doc(db, "likes", `${meuId}_${outroId}`), {
            de: meuId,
            para: outroId,
            timestamp: serverTimestamp()
        });

        // 2. Verifica se a outra pessoa também te deu like (Match)
        const q = query(collection(db, "likes"), 
            where("de", "==", outroId), 
            where("para", "==", meuId)
        );
        
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            alert(`❤️ É UM MATCH com ${outroNome}! ❤️`);
            // Cria o chat automaticamente
            await criarChatAutomatico(meuId, outroId, outroNome);
        }

        // Remove o card da tela com efeito visual
        removerCardInterface(outroId);

    } catch (error) {
        console.error("Erro ao curtir:", error);
    }
};

window.passarUsuario = function(id) {
    removerCardInterface(id);
};

function removerCardInterface(id) {
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) {
        card.style.transform = "translateX(-100px) rotate(-10deg)";
        card.style.opacity = "0";
        setTimeout(() => card.remove(), 300);
    }
}

async function criarChatAutomatico(meuId, outroId, outroNome) {
    const chatId = meuId < outroId ? `${meuId}_${outroId}` : `${outroId}_${meuId}`;
    await setDoc(doc(db, "chats", chatId), {
        participantes: [meuId, outroId],
        dataUltimaMensagem: serverTimestamp(),
        ultimaMensagem: "Vocês deram match! Comecem a conversar.",
        [`naoLidas_${outroId}`]: 1
    }, { merge: true });
}

/* ==========================================
   LÓGICA DO CHAT
   ========================================== */
window.iniciarChat = async function(outroUsuarioId, outroUsuarioNome) {
    const meuId = auth.currentUser.uid;
    const chatId = meuId < outroUsuarioId ? `${meuId}_${outroUsuarioId}` : `${outroUsuarioId}_${meuId}`;
    
    try {
        await setDoc(doc(db, "chats", chatId), {
            participantes: [meuId, outroUsuarioId],
            dataUltimaMensagem: serverTimestamp(),
            ultimaMensagem: "" 
        }, { merge: true });

        localStorage.setItem("chatAtivoId", chatId);
        localStorage.setItem("outroUsuarioId", outroUsuarioId);
        localStorage.setItem("outroUsuarioNome", outroUsuarioNome);
        
        window.location.href = "mensagens.html";
    } catch (error) {
        console.error("Erro ao iniciar chat:", error);
    }
};

/* ==========================================
   RENDERIZAÇÃO DA INTERFACE
   ========================================== */
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
    
    const authContainer = document.getElementById("auth-buttons");
    if(authContainer) {
        authContainer.innerHTML = `
            <span style="font-weight:600; color: #333;">Olá, ${nome}!</span>
            <button id="logoutBtn" class="login" style="margin-left:15px; background: #ff4b2b; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer;">Sair</button>
        `;

        document.getElementById("logoutBtn").onclick = () => {
            signOut(auth).then(() => window.location.href = "index.html");
        };
    }
}

async function renderUsers() {
    const grid = document.getElementById("users-grid");
    if(!grid) return;
    
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
            const fotoPerfil = data.foto || `https://via.placeholder.com/400x500?text=${data.nome}`;
            
            // Adicionei o data-id para facilitar a remoção do card
            grid.innerHTML += `
    <div class="user-card" data-id="${data.uid}">
        <div class="user-photo-container">
            <img src="${fotoPerfil}" class="user-photo" alt="Foto de ${data.nome}">
            <div class="photo-overlay"></div>
        </div>
        <div class="user-info">
            <h3>${data.nome} <span>${age}</span></h3>
            <p>${data.bio || "Olá! Vamos conversar?"}</p>
        </div>
        <div class="card-actions">
            <button class="action-btn pass" title="Passar" onclick="passarUsuario('${data.uid}')">
                <i class="fa-solid fa-xmark"></i>
            </button>
            
            <button class="action-btn like" title="Curtir" onclick="curtirUsuario('${data.uid}', '${data.nome}')">
                <i class="fa-solid fa-heart"></i>
            </button>

            <button class="action-btn chat" title="Mensagem" onclick="iniciarChat('${data.uid}', '${data.nome}')">
                <i class="fa-solid fa-message"></i>
            </button>
        </div>
    </div>
`;
        });

        if (!encontrouAlguem) {
            grid.innerHTML = `<div class="empty-feed"><h2>Ninguém por aqui...</h2></div>`;
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