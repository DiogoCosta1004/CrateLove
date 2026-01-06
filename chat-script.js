import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    onSnapshot, 
    serverTimestamp,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    where,
    increment 
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

let chatIdAtivo = null;
let outroUsuarioId = null;
let unsubMensagens = null; 

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    renderHeaderChat(user);
    carregarListaDeConversas(user.uid);

    const idSalvo = localStorage.getItem("chatAtivoId");
    if (idSalvo) {
        const outroIdSalvo = localStorage.getItem("outroUsuarioId");
        const nomeSalvo = localStorage.getItem("outroUsuarioNome");
        window.mudarDeChat(idSalvo, outroIdSalvo, nomeSalvo);
        localStorage.removeItem("chatAtivoId");
    } else {
        mostrarTelaVazia();
    }
});

async function renderHeaderChat(user) {
    const docSnap = await getDoc(doc(db, "usuarios", user.uid));
    const nome = docSnap.exists() ? docSnap.data().nome : "Usuário";
    const authContainer = document.getElementById("auth-buttons");
    if (authContainer) {
        authContainer.innerHTML = `
            <span style="font-weight:600; color: #333;">Olá, ${nome}!</span>
            <button id="logoutBtn" class="login" style="margin-left:15px; background: #ff4b2b; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer;">Sair</button>
        `;
        document.getElementById("logoutBtn").onclick = () => auth.signOut().then(() => window.location.href = "index.html");
    }
}

// --- LISTA LATERAL SEM DUPLICAÇÃO ---
function carregarListaDeConversas(meuId) {
    const listaContainer = document.getElementById("chat-list");
    const q = query(
        collection(db, "chats"),
        where("participantes", "array-contains", meuId),
        orderBy("dataUltimaMensagem", "desc")
    );

    onSnapshot(q, async (snapshot) => {
        // Criamos um fragmento ou limpamos imediatamente
        listaContainer.innerHTML = ""; 
        
        // Usamos for...of para lidar com o await corretamente sem bagunçar a ordem
        for (const chatDoc of snapshot.docs) {
            const chatData = chatDoc.data();
            const chatId = chatDoc.id;
            const oId = chatData.participantes.find(id => id !== meuId);
            const naoLidas = chatData[`naoLidas_${meuId}`] || 0;

            const userSnap = await getDoc(doc(db, "usuarios", oId));
            const dadosOutro = userSnap.data() || { nome: "Usuário", foto: "" };

            const item = document.createElement("div");
            item.className = `chat-item ${chatId === chatIdAtivo ? 'active' : ''}`;
            item.onclick = () => window.mudarDeChat(chatId, oId, dadosOutro.nome);

            item.innerHTML = `
                <img src="${dadosOutro.foto || 'https://via.placeholder.com/45'}" class="chat-item-img">
                <div class="chat-item-info">
                    <div class="chat-item-header">
                        <strong>${dadosOutro.nome}</strong>
                        ${naoLidas > 0 ? `<span class="badge">${naoLidas}</span>` : ''}
                    </div>
                    <p>${chatData.ultimaMensagem || "Clique para conversar"}</p>
                </div>
            `;
            listaContainer.appendChild(item);
        }
    });
}

window.mudarDeChat = async (id, oId, nome) => {
    if (unsubMensagens) unsubMensagens();

    chatIdAtivo = id;
    outroUsuarioId = oId;

    document.getElementById("target-user-name").innerText = nome;
    document.getElementById("chat-form").style.display = "flex";
    
    // Limpeza radical do container antes de abrir o novo
    const container = document.getElementById("chat-messages");
    container.innerHTML = ""; 

    escutarMensagens();

    const meuId = auth.currentUser.uid;
    await updateDoc(doc(db, "chats", id), {
        [`naoLidas_${meuId}`]: 0
    }).catch(() => {});

    // Atualiza visualmente a lista lateral
    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
};

function mostrarTelaVazia() {
    document.getElementById("target-user-name").innerText = "Selecione um contato";
    document.getElementById("chat-form").style.display = "none";
    document.getElementById("chat-messages").innerHTML = `
        <div class="empty-chat">
            <i class="fa-regular fa-comments"></i>
            <p>Escolha uma conversa ao lado para começar!</p>
        </div>
    `;
}

function escutarMensagens() {
    const container = document.getElementById("chat-messages");
    const q = query(collection(db, "chats", chatIdAtivo, "mensagens"), orderBy("timestamp", "asc"));

    unsubMensagens = onSnapshot(q, (snapshot) => {
        // Limpa tudo antes de desenhar para evitar duplicação visual
        container.innerHTML = ""; 
        
        snapshot.forEach((msgDoc) => {
            const msg = msgDoc.data();
            const div = document.createElement("div");
            div.className = `message ${msg.senderId === auth.currentUser.uid ? "sent" : "received"}`;
            div.innerText = msg.texto;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    });
}

document.getElementById("chat-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("msg-input");
    const texto = input.value.trim();

    if (texto && chatIdAtivo && outroUsuarioId) {
        input.value = ""; 
        const meuId = auth.currentUser.uid;
        
        try {
            await setDoc(doc(db, "chats", chatIdAtivo), {
                participantes: [meuId, outroUsuarioId],
                ultimaMensagem: texto,
                dataUltimaMensagem: serverTimestamp(),
                [`naoLidas_${outroUsuarioId}`]: increment(1)
            }, { merge: true });

            await addDoc(collection(db, "chats", chatIdAtivo, "mensagens"), {
                texto: texto,
                senderId: meuId,
                timestamp: serverTimestamp()
            });
        } catch (err) {
            console.error("Erro ao enviar:", err);
        }
    }
});